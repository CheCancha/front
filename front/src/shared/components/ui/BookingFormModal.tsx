// src/shared/components/ui/BookingFormModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, DollarSign, List, BarChart } from "lucide-react";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import type { BookingStatus, Court } from "@prisma/client";

// --- TIPOS ---
type CourtWithSport = Court & { sport: { name: string } };

// La estructura de los datos que el formulario va a manejar y enviar
export type SubmitPayload = {
  bookingId?: string;
  guestName: string;
  courtId: string;
  time: string;
  status: BookingStatus;
  depositPaid: number;
};

// Las props que el modal recibe desde la página del calendario
export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: SubmitPayload) => Promise<void>;
  courts: CourtWithSport[];
  timeSlots: string[];
  initialValues?: Partial<SubmitPayload & { id: string }>; // Puede recibir valores iniciales para editar
  isEditing: boolean;
}

const BookingFormModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  courts,
  timeSlots,
  initialValues,
  isEditing,
}) => {
  const defaultState: SubmitPayload = {
    guestName: "",
    courtId: courts[0]?.id || "",
    time: timeSlots[0] || "09:00",
    status: "CONFIRMADO",
    depositPaid: 0,
  };

  const [formData, setFormData] = useState<SubmitPayload>(defaultState);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cuando los valores iniciales cambian (al abrir el modal para editar),
  // actualizamos el estado del formulario.
  useEffect(() => {
    if (isOpen && initialValues) {
      setFormData({
        bookingId: initialValues.id,
        guestName: initialValues.guestName || "",
        courtId: initialValues.courtId || courts[0]?.id,
        time: initialValues.time || timeSlots[0],
        status: initialValues.status || "CONFIRMADO",
        depositPaid: initialValues.depositPaid || 0,
      });
    } else if (!isOpen) {
        // Resetea el formulario cuando se cierra
        setTimeout(() => setFormData(defaultState), 300);
    }
  }, [isOpen, initialValues, courts, timeSlots]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Convertimos a número si es el campo de depósito
      [name]: name === "depositPaid" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onSubmit(formData);
    setIsProcessing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 m-4"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              {isEditing ? "Editar Reserva" : "Nueva Reserva"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-semibold text-gray-700 mb-1">
                  <User className="inline-block w-4 h-4 mr-1" /> Nombre Cliente
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="courtId" className="block text-sm font-semibold text-gray-700 mb-1">
                      <List className="inline-block w-4 h-4 mr-1" /> Cancha
                    </label>
                    <select
                      id="courtId"
                      name="courtId"
                      value={formData.courtId}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    >
                      {courts.map((court) => (
                        <option key={court.id} value={court.id}>{court.name}</option>
                      ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-1">
                       <BarChart className="inline-block w-4 h-4 mr-1" /> Horario
                    </label>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">
                       <BarChart className="inline-block w-4 h-4 mr-1" /> Estado
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    >
                      <option value="CONFIRMADO">Confirmado</option>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="COMPLETADO">Completado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                 <div>
                   <label htmlFor="depositPaid" className="block text-sm font-semibold text-gray-700 mb-1">
                    <DollarSign className="inline-block w-4 h-4 mr-1" /> Seña Pagada (ARS)
                   </label>
                   <input
                     type="number"
                     id="depositPaid"
                     name="depositPaid"
                     value={formData.depositPaid}
                     onChange={handleChange}
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                     placeholder="0"
                   />
                 </div>
              </div>

              <div className="pt-6">
                <ButtonPrimary type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? "Guardando..." : (isEditing ? "Actualizar Reserva" : "Crear Reserva")}
                </ButtonPrimary>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingFormModal;