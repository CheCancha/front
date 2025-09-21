"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  const [requests, setRequests] = useState(initialRequests);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InscriptionRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReviewClick = (request: InscriptionRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleActionComplete = () => {
    fetchRequests(); 
    handleCloseModal();
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center p-8">
            <Spinner />
        </div>
    );
  }
  
  if (error) {
    return <p className="text-red-600 p-4">{error}</p>;
  }

  return (
    <>
      <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Solicitudes de Inscripción Pendientes</h2>
        {requests.length === 0 ? (
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
                          <button onClick={() => handleReviewClick(req)} className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-md hover:bg-neutral-950 transition-colors">
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
                    <button onClick={() => handleReviewClick(req)} className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-md hover:bg-neutral-950 transition-colors">
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