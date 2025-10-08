"use client";

import React, { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, XCircle, Save } from "lucide-react";
import { InscriptionRequest } from "@prisma/client";
import {
  approveInscription,
  rejectInscription,
  updateInscription,
} from "@/app/features/admin/services/admin.service";
import { toast } from "react-hot-toast";
import { Button } from "@/shared/components/ui/button";

interface InscriptionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: InscriptionRequest | null;
  onActionComplete: () => void;
}

const EditableDetailItem = ({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label htmlFor={name} className="text-xs font-medium text-gray-500">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type="text"
      value={value || ""}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-base text-gray-800 p-2 border"
    />
  </div>
);

export const InscriptionReviewModal: React.FC<InscriptionReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onActionComplete, // <-- Prop añadida
}) => {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<Partial<InscriptionRequest>>({});

  useEffect(() => {
    if (request) {
      setFormData(request);
    }
  }, [request]);

  if (!request) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (!request) return;
    startTransition(async () => {
      toast.loading("Guardando cambios...");
      const result = await updateInscription(request.id, formData);
      toast.dismiss();
      if (result.success) {
        toast.success("Cambios guardados.");
        onActionComplete();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  const handleApprove = () => {
    if (!request) return;
    startTransition(async () => {
      toast.loading("Aprobando solicitud...");
      const result = await approveInscription(request.id, formData);
      toast.dismiss();
      if (result.success) {
        toast.success("¡Solicitud aprobada!");
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
    if (!request) return;
    startTransition(async () => {
      toast.loading("Rechazando solicitud...");
      const result = await rejectInscription(request.id);
      toast.dismiss();
       if (result.success) {
        toast.success("Solicitud rechazada.");
        onActionComplete();
      } else {
        toast.error(`Error: ${result.error}`);
      }
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
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Revisar Solicitud
              </h2>
              <p className="text-sm text-paragraph mb-6">
                Complejo:{" "}
                <span className="font-semibold">{formData.complexName}</span>
              </p>

              <div className="space-y-6 border-t border-b py-6 max-h-[50vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <EditableDetailItem label="Nombre del Dueño" name="ownerName" value={formData.ownerName || ""} onChange={handleInputChange}/>
                  <EditableDetailItem label="Email de Contacto" name="ownerEmail" value={formData.ownerEmail || ""} onChange={handleInputChange}/>
                  <EditableDetailItem label="Teléfono" name="ownerPhone" value={formData.ownerPhone || ""} onChange={handleInputChange}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <EditableDetailItem label="Dirección" name="address" value={formData.address || ""} onChange={handleInputChange} />
                    <EditableDetailItem label="Ciudad" name="city" value={formData.city || ""} onChange={handleInputChange} />
                    <EditableDetailItem label="Provincia" name="province" value={formData.province || ""} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EditableDetailItem label="Deportes Ofrecidos" name="sports" value={formData.sports || ""} onChange={handleInputChange}/>
                    <EditableDetailItem label="Plan Seleccionado" name="selectedPlan" value={formData.selectedPlan || ""} onChange={handleInputChange}/>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button variant='ghost' onClick={handleReject} disabled={isPending} className="w-full sm:w-auto">
                  <XCircle size={16} className="mr-2" />
                  {isPending ? "Rechazando..." : "Rechazar"}
                </Button>
                <Button variant='ghost' onClick={handleUpdate} disabled={isPending} className="w-full sm:w-auto border-gray-400">
                  <Save size={16} className="mr-2" />
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button onClick={handleApprove} disabled={isPending} className="w-full sm:w-auto">
                  <Check size={16} className="mr-2" />
                  {isPending ? "Aprobando..." : "Aprobar Solicitud"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};