"use client";

import React, { useState } from "react";
import type { InscriptionRequest } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InscriptionReviewModal } from "@/app/features/admin/components/InscriptionModal";

interface InscriptionRequestsProps {
  initialRequests: InscriptionRequest[];
}

/**
 * Componente de cliente que muestra la tabla de solicitudes de inscripción.
 * Ahora, al hacer clic en "Revisar", abre un modal con los detalles completos.
 */
export default function InscriptionRequests({ initialRequests }: InscriptionRequestsProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InscriptionRequest | null>(null);

  // Abre el modal y establece la solicitud seleccionada
  const handleReviewClick = (request: InscriptionRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Cierra el modal y limpia la selección
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleActionComplete = (processedRequestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== processedRequestId));
    handleCloseModal();
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Solicitudes de Inscripción Pendientes</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">No hay nuevas solicitudes pendientes.</p>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="p-3 text-gray-600">
                      {format(new Date(req.createdAt), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="p-3 text-center">
                       <button
                        onClick={() => handleReviewClick(req)}
                        className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-md hover:bg-neutral-950"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Renderizamos el Modal aquí */}
      <InscriptionReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
      />
    </>
  );
}

