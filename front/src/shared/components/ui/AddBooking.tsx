"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Court, BookingStatus } from "@prisma/client";
import { cn } from "@/shared/lib/utils";

type CourtWithPriceRules = Court & {
  priceRules: {
    id: string;
    startTime: number;
    endTime: number;
    price: number;
    depositPercentage: number;
  }[];
};

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: SubmitPayload) => Promise<void>;
  courts: CourtWithPriceRules[];
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
  date: string; 
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
  const [paymentOption, setPaymentOption] = useState<
    "none" | "deposit" | "total"
  >("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const bookingDate = format(selectedDate, "yyyy-MM-dd");

  // --- LÓGICA CENTRAL ---
  const applicablePriceRule = useMemo(() => {
    const selectedCourt = courts.find((c) => c.id === courtId);
    if (!selectedCourt) return null;

    const selectedHour = parseInt(time.split(":")[0], 10);
    return selectedCourt.priceRules.find(
      (rule) => selectedHour >= rule.startTime && selectedHour < rule.endTime
    );
  }, [courtId, time, courts]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        setCourtId(initialValues.courtId);
        setTime(initialValues.time);
        setStatus(initialValues.status || "PENDIENTE");
        setGuestName(initialValues.guestName || "");

        const initialCourt = courts.find((c) => c.id === initialValues.courtId);
        const initialHour = parseInt(initialValues.time.split(":")[0], 10);
        const initialRule = initialCourt?.priceRules.find(
          (r) => initialHour >= r.startTime && initialHour < r.endTime
        );
        const amountPaid = initialValues.depositPaid || 0;

        if (initialRule) {
          if (amountPaid >= initialRule.price && initialRule.price > 0) {
            setPaymentOption("total");
          } else if (
            amountPaid >= initialRule.depositPercentage &&
            amountPaid > 0
          ) {
            setPaymentOption("deposit");
          } else {
            setPaymentOption("none");
          }
        } else {
          setPaymentOption("none");
        }
      } else {
        setCourtId(initialValues?.courtId || courts[0]?.id || "");
        setTime(initialValues?.time || timeSlots[0]);
        setStatus("PENDIENTE");
        setPaymentOption("none");
        setGuestName("");
      }
      setIsSubmitting(false);
      setApiError(null);
    }
  }, [isOpen, initialValues, isEditing, courts, timeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !courtId || isSubmitting || !applicablePriceRule) {
      if (!applicablePriceRule) {
        setApiError(
          "No hay un precio configurado para el horario seleccionado."
        );
      }
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    let finalAmountPaid = 0;
    if (paymentOption === "deposit") {
      finalAmountPaid = applicablePriceRule.depositPercentage;
    } else if (paymentOption === "total") {
      finalAmountPaid = applicablePriceRule.price;
    }

    const baseData: CreateBookingPayload = {
      guestName,
      courtId,
      time,
      date: bookingDate,
      status,
      depositPaid: finalAmountPaid,
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
    } finally {
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
              {/* --- Campos de Nombre, Cancha, Horario y Estado (SIN CAMBIOS) --- */}
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

              {/* ---  Precios dinámicos en el Select de Pago --- */}
              <div>
                <label
                  htmlFor="paymentOption"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Estado del Pago
                </label>
                <select
                  id="paymentOption"
                  value={paymentOption}
                  onChange={(e) =>
                    setPaymentOption(
                      e.target.value as "none" | "deposit" | "total"
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!applicablePriceRule}
                >
                  <option value="none">No Pagado</option>
                  {applicablePriceRule && (
                    <>
                      <option value="deposit">
                        Seña (${applicablePriceRule.depositPercentage})
                      </option>
                      <option value="total">
                        Total (${applicablePriceRule.price})
                      </option>
                    </>
                  )}
                </select>
                {!applicablePriceRule && courtId && (
                  <p className="text-xs text-red-600 mt-1">
                    No hay un precio definido para este horario. Por favor,
                    configúralo en los ajustes.
                  </p>
                )}
              </div>

              {/* --- Mensaje de error y botón de envío (SIN CAMBIOS) --- */}
              {apiError && (
                <div
                  className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md flex items-start"
                  role="alert"
                >
                  <AlertTriangle className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-bold">No se pudo procesar la reserva</p>
                    <p className="text-sm">{apiError}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !applicablePriceRule}
                  className={cn(
                    "w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center",
                    (isSubmitting || !applicablePriceRule) &&
                      "bg-gray-500 cursor-not-allowed"
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
