"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  DollarSign,
  List,
  BarChart,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import type {
  BookingStatus,
  Court,
  Booking as PrismaBooking,
} from "@prisma/client";
import { toast } from "react-hot-toast";
// --- TIPOS ---
type CourtWithSport = Court & { sport: { name: string } };
type BookingWithDetails = PrismaBooking & {
  court: { id: string; name: string; slotDurationMinutes: number };
  user?: { name: string | null } | null;
};

export type SubmitPayload = {
  bookingId?: string;
  guestName: string;
  courtId: string;
  time: string;
  status: BookingStatus;
  depositPaid: number;
};

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: SubmitPayload) => Promise<void>;
  courts: CourtWithSport[];
  timeSlots: string[];
  initialValues?: Partial<SubmitPayload & { id: string }>;
  isEditing: boolean;
  // --- NUEVA PROP ---
  existingBookings: BookingWithDetails[];
}

const BookingFormModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  courts,
  timeSlots,
  initialValues,
  isEditing,
  existingBookings,
}) => {
  const [formData, setFormData] = useState<SubmitPayload>({
    guestName: "",
    courtId: courts[0]?.id || "",
    time: timeSlots[0] || "09:00",
    status: "CONFIRMADO",
    depositPaid: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  // --- NUEVO ESTADO PARA LA ADVERTENCIA ---
  const [warning, setWarning] = useState<string | null>(null);

  // --- useEffect para inicializar el formulario ---
  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        setFormData({
          bookingId: initialValues.id,
          guestName: initialValues.guestName || "",
          courtId: initialValues.courtId || courts[0]?.id,
          time: initialValues.time || timeSlots[0],
          status: initialValues.status || "CONFIRMADO",
          depositPaid: initialValues.depositPaid || 0,
        });
      } else if (!isEditing) {
        setFormData({
          guestName: "",
          courtId: initialValues?.courtId || courts[0]?.id,
          time: initialValues?.time || timeSlots[0],
          status: "CONFIRMADO",
          depositPaid: 0,
        });
      }
    }
  }, [isOpen, isEditing, initialValues, courts, timeSlots]);

  // --- NUEVO useEffect para validar superposición en tiempo real ---
  useEffect(() => {
    if (!isOpen) return; // No validar si el modal está cerrado

    const selectedCourt = courts.find((c) => c.id === formData.courtId);
    if (!selectedCourt) return;

    const [hour, minute] = formData.time.split(":").map(Number);
    const newStartMinutes = hour * 60 + minute;
    const newEndMinutes = newStartMinutes + selectedCourt.slotDurationMinutes;

    const overlap = existingBookings.find((booking) => {
      // Ignoramos la propia reserva que estamos editando
      if (isEditing && booking.id === formData.bookingId) {
        return false;
      }

      if (booking.court.id !== formData.courtId) {
        return false;
      }

      const existingStartMinutes =
        booking.startTime * 60 + (booking.startMinute || 0);
      const existingEndMinutes =
        existingStartMinutes + booking.court.slotDurationMinutes;

      return (
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes
      );
    });

    if (overlap) {
      setWarning("¡Atención! Este horario se superpone con otra reserva.");
    } else {
      setWarning(null);
    }
  }, [
    formData.courtId,
    formData.time,
    existingBookings,
    isOpen,
    isEditing,
    formData.bookingId,
    courts,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "depositPaid" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.guestName.trim() === "") {
      alert("El nombre del cliente es obligatorio.");
      return;
    }
    // No permitir enviar si hay una advertencia (doble seguridad)
    if (warning && !isEditing) {
      toast.error(warning);
      return;
    }
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
            onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro
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
                <label
                  htmlFor="guestName"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  <User className="inline-block w-4 h-4 mr-1" /> Nombre Cliente
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="courtId"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    <List className="inline-block w-4 h-4 mr-1" /> Cancha
                  </label>
                  <select
                    id="courtId"
                    name="courtId"
                    value={formData.courtId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    <Clock className="inline-block w-4 h-4 mr-1" /> Horario
                  </label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    <BarChart className="inline-block w-4 h-4 mr-1" /> Estado
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="CONFIRMADO">Confirmado</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="depositPaid"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    <DollarSign className="inline-block w-4 h-4 mr-1" /> Seña
                    Pagada (ARS)
                  </label>
                  <input
                    type="number"
                    id="depositPaid"
                    name="depositPaid"
                    value={formData.depositPaid}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {warning && (
                <div className="flex items-center gap-2 p-3 text-sm text-yellow-800 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{warning}</span>
                </div>
              )}

              <div className="pt-2">
                <ButtonPrimary
                  type="submit"
                  className="w-full"
                  disabled={isProcessing || (!!warning && !isEditing)}
                >
                  {isProcessing
                    ? "Guardando..."
                    : isEditing
                    ? "Actualizar Reserva"
                    : "Crear Reserva"}
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
