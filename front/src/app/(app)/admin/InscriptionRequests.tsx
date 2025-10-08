"use client";

import React, { useState, useCallback, useTransition } from "react";
import type { InscriptionRequest } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InscriptionReviewModal } from "@/app/features/admin/components/InscriptionModal";
import { Spinner } from "@/shared/components/ui/Spinner";
import { Briefcase, User, Calendar, RefreshCw } from "lucide-react";
import { getPendingInscriptionRequestsForAdmin } from "@/app/features/admin/services/admin.service";

// Props para los componentes de item individual
interface RequestItemProps {
  request: InscriptionRequest;
  onReview: (request: InscriptionRequest) => void;
}

// Componente para la tarjeta en vista móvil
const RequestCard: React.FC<RequestItemProps> = ({ request, onReview }) => (
  <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-grow">
        <p className="font-semibold text-gray-800 break-words">{request.complexName}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
          <User size={14} className="flex-shrink-0" /> {request.ownerName}
        </p>
      </div>
      <button
        onClick={() => onReview(request)}
        className="px-3 py-1.5 bg-brand-orange text-white text-xs font-semibold rounded-md hover:bg-neutral-950 transition-colors cursor-pointer flex-shrink-0"
      >
        Revisar
      </button>
    </div>
    <div className="mt-3 pt-3 border-t flex justify-between items-center text-sm text-gray-600">
      <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
        <Briefcase size={14} /> {request.selectedPlan}
      </span>
      <span className="flex items-center gap-1.5 text-xs">
        <Calendar size={14} /> {format(new Date(request.createdAt), "dd MMM yyyy", { locale: es })}
      </span>
    </div>
  </div>
);

// Componente para la fila de la tabla en vista de escritorio
const RequestTableRow: React.FC<RequestItemProps> = ({ request, onReview }) => (
  <tr className="border-b hover:bg-gray-50 transition-colors">
    <td className="p-3 font-medium text-gray-800">{request.complexName}</td>
    <td className="p-3 text-gray-600">{request.ownerName}</td>
    <td className="p-3 text-gray-600">{request.selectedPlan}</td>
    <td className="p-3 text-gray-600">{format(new Date(request.createdAt), "dd MMM yyyy", { locale: es })}</td>
    <td className="p-3 text-center">
      <button
        onClick={() => onReview(request)}
        className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded-md hover:bg-neutral-950 transition-colors cursor-pointer"
      >
        Revisar
      </button>
    </td>
  </tr>
);


// Componente principal
export default function InscriptionRequests({ initialRequests }: { initialRequests: InscriptionRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InscriptionRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- 2. Actualizamos fetchRequests para que use la Server Action ---
  const fetchRequests = useCallback(async () => {
    setError(null);
    try {
      const data = await getPendingInscriptionRequestsForAdmin();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado al cargar las solicitudes.');
    }
  }, []);

  const handleRefresh = () => {
    startTransition(() => {
      fetchRequests();
    });
  };

  const handleReviewClick = (request: InscriptionRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleActionComplete = () => {
    handleRefresh();
    handleCloseModal();
  };

  return (
    <>
      <div className="bg-[#f8f9f9] p-4 sm:p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Solicitudes Pendientes</h2>
          <button onClick={handleRefresh} disabled={isPending} className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-wait">
            {isPending ? <Spinner /> : <RefreshCw className="w-4 h-4 text-gray-600" />}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {requests.length === 0 && !isPending ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No hay nuevas solicitudes pendientes.</p>
            <p className="text-sm text-gray-400 mt-1">¡Buen trabajo!</p>
          </div>
        ) : (
          <div>
            {/* Tabla para Escritorio */}
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
                    <RequestTableRow key={req.id} request={req} onReview={handleReviewClick} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas para Móvil */}
            <div className="md:hidden space-y-3">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} onReview={handleReviewClick} />
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