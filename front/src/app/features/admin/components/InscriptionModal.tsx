"use client";

import React, { useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle } from 'lucide-react';
import { ButtonPrimary, ButtonGhost } from '@/shared/components/ui/Buttons';
import { InscriptionRequest } from '@prisma/client';
import { approveInscription, rejectInscription } from '@/app/features/admin/inscriptionActions';
import { toast } from 'react-hot-toast';

interface InscriptionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: InscriptionRequest | null;
  onActionComplete: () => void;
}

const DetailItem = ({ label, value }: { label: string; value: string | null }) => (
    <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-base text-gray-800">{value || '-'}</p>
    </div>
);

export const InscriptionReviewModal: React.FC<InscriptionReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onActionComplete,
}) => {
  const [isPending, startTransition] = useTransition();

  if (!request) return null;

  const handleApprove = () => {
    startTransition(async () => {
      toast.loading("Aprobando solicitud...");
      const result = await approveInscription(request.id);
      
      toast.dismiss();
      if (result.success) {
        toast.success("¡Solicitud aprobada con éxito!");
        if (result.warning) {
          toast.error(`Advertencia: ${result.warning}`, { duration: 6000 });
        }
        onActionComplete();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      toast.loading("Rechazando solicitud...");
      await rejectInscription(request.id);
      toast.dismiss();
      toast.success("Solicitud rechazada.");
      onActionComplete();
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Revisar Solicitud</h2>
              <p className="text-sm text-paragraph mb-6">Complejo: <span className="font-semibold">{request.complexName}</span></p>
              
              <div className="space-y-6 border-t border-b py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailItem label="Nombre del Dueño" value={request.ownerName} />
                  <DetailItem label="Email de Contacto" value={request.ownerEmail} />
                  <DetailItem label="Teléfono" value={request.ownerPhone} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailItem label="Dirección" value={request.address} />
                  <DetailItem label="Ciudad" value={request.city} />
                  <DetailItem label="Provincia" value={request.province} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Deportes Ofrecidos" value={request.sports} />
                  <DetailItem label="Plan Seleccionado" value={request.selectedPlan} />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <ButtonGhost onClick={handleReject} disabled={isPending} className="w-full sm:w-auto">
                  <XCircle size={16} className="mr-2" />
                  {isPending ? 'Rechazando...' : 'Rechazar'}
                </ButtonGhost>
                <ButtonPrimary onClick={handleApprove} disabled={isPending} className="w-full sm:w-auto">
                  <Check size={16} className="mr-2" />
                  {isPending ? 'Aprobando...' : 'Aprobar Solicitud'}
                </ButtonPrimary>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};