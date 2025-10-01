"use client";

import React, { useState, useCallback } from "react";
import type { InscriptionRequest } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InscriptionReviewModal } from "@/app/features/admin/components/InscriptionModal";
import { Spinner } from "@/shared/components/ui/Spinner"; 
import { Briefcase, User, Calendar } from "lucide-react";

interface InscriptionRequestsProps {
  initialRequests: InscriptionRequest[];
}

export default function InscriptionRequests({ initialRequests }: InscriptionRequestsProps) {
  // El estado ahora se inicializa y confía en los datos del servidor.
  const [requests, setRequests] = useState(initialRequests);
  // isLoading ya no es necesario para la carga inicial.
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InscriptionRequest | null>(null);

  // La función fetch ahora es para 'refrescar' la lista.
  const fetchRequests = useCallback(async () => {
    setIsRefreshing(true); // Usamos un nuevo estado para el spinner de refresco.
    setError(null);
    try {
      const response = await fetch('/api/admin/requests');
      if (!response.ok) {
        throw new Error('No se pudieron cargar las solicitudes pendientes.');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Ya no necesitamos el useEffect para la carga inicial.

  const handleReviewClick = (request: InscriptionRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleActionComplete = () => {
    fetchRequests(); // Llama a la función para refrescar la lista.
    handleCloseModal();
  };
  
  // El error se puede mostrar directamente.
  if (error) {
    return <p className="text-red-600 p-4">{error}</p>;
  }

  return (
    <>
      <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Solicitudes de Inscripción Pendientes</h2>
            {isRefreshing && <Spinner />}
        </div>
        
        {requests.length === 0 && !isRefreshing ? (
          <p className="text-gray-500">No hay nuevas solicitudes pendientes.</p>
        ) : (
          <div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-3 font-semibold text-gray-700">Complejo</th>
                    <th className="p-3 font-semibold text-gray-700">Solicitante</th>
                    <th className="p-3 font-semibold text-gray-700">Plan</th>
                    <th className="p-3 font-semibold text-gray-700">Fecha</th>
                    <th className="p-3 font-semibold text-gray-700 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{req.complexName}</td>
                      <td className="p-3 text-gray-600">{req.ownerName}</td>
                      <td className="p-3 text-gray-600">{req.selectedPlan}</td>
                      <td className="p-3 text-gray-600">{format(new Date(req.createdAt), "dd MMM yyyy", { locale: es })}</td>
                      <td className="p-3 text-center">
                          <button onClick={() => handleReviewClick(req)} className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-md hover:bg-neutral-950 transition-colors cursor-pointer">
                              Revisar
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{req.complexName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><User size={12}/> {req.ownerName}</p>
                    </div>
                    <button onClick={() => handleReviewClick(req)} className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-md hover:bg-neutral-950 transition-colors cursor-pointer">
                      Revisar
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Briefcase size={12}/> {req.selectedPlan}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={12}/> {format(new Date(req.createdAt), "dd MMM yyyy", { locale: es })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <InscriptionReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
        onActionComplete={handleActionComplete}
      />
    </>
  );
}
