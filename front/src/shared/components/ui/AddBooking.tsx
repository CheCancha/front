"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Court, BookingStatus } from "@prisma/client";
import { cn } from "@/shared/lib/utils";

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: SubmitPayload) => Promise<void>;
  courts: Court[];
  timeSlots: string[];
  selectedDate: Date;
  isEditing?: boolean;
  initialValues?: {
    id?: string;
    courtId: string;
    guestName?: string;
    time: string;
    status?: BookingStatus;
    depositPaid?: number;
  };
}

type CreateBookingPayload = {
  guestName: string;
  courtId: string;
  time: string;
  date: string; // yyyy-MM-dd
  status: BookingStatus;
  depositPaid: number;
};

type UpdateBookingPayload = CreateBookingPayload & { bookingId: string };

type SubmitPayload = CreateBookingPayload | UpdateBookingPayload;

const AddBookingModal: React.FC<AddBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  courts,
  timeSlots,
  selectedDate,
  initialValues,
  isEditing,
}) => {
  const [guestName, setGuestName] = useState("");
  const [courtId, setCourtId] = useState(
    initialValues?.courtId || courts[0]?.id || ""
  );
  const [time, setTime] = useState(initialValues?.time || timeSlots[0]);
  const [status, setStatus] = useState<BookingStatus>(
    initialValues?.status || "PENDIENTE"
  );
  const [depositPaid, setDepositPaid] = useState<number>(
    initialValues?.depositPaid || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const bookingDate = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        setCourtId(initialValues.courtId);
        setTime(initialValues.time);
        setStatus(initialValues.status || "PENDIENTE");
        setDepositPaid(initialValues.depositPaid || 0);
        setGuestName(initialValues.guestName || "");
      } else {
        setCourtId(initialValues?.courtId || courts[0]?.id || "");
        setTime(initialValues?.time || timeSlots[0]);
        setStatus("PENDIENTE");
        setDepositPaid(0);
        setGuestName("");
      }
      setIsSubmitting(false);
      setApiError(null);
    }
  }, [isOpen, initialValues, isEditing, courts, timeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !courtId || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);

    const baseData: CreateBookingPayload = {
      guestName,
      courtId,
      time,
      date: bookingDate,
      status,
      depositPaid,
    };

    const submissionData: SubmitPayload =
      isEditing && initialValues?.id
        ? { ...baseData, bookingId: initialValues.id }
        : baseData;

    try {
      await onSubmit(submissionData);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Ocurrió un error inesperado."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
          >
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {isEditing ? "Editar Reserva" : "Añadir Reserva Manual"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos del formulario (sin cambios) */}
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre del Cliente
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Lionel Messi"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="court"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cancha
                </label>
                <select
                  id="court"
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Horario
                </label>
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Estado
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="COMPLETADO">Completado</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="deposit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Señal pagada
                </label>
                <input
                  id="deposit"
                  type="number"
                  min={0}
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Contenedor para el mensaje de error */}
              {apiError && (
                <div
                  className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md flex items-start"
                  role="alert"
                >
                  <AlertTriangle className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-bold">No se pudo crear la reserva</p>
                    <p className="text-sm">{apiError}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center",
                    isSubmitting && "bg-gray-500 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : null}
                  {isEditing ? "Guardar Cambios" : "Confirmar Reserva"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddBookingModal;
