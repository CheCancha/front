"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  Tag,
  DollarSign,
  Calendar,
  Clock,
  BadgeCheck,
  Ban,
  Edit,
  List,
  BarChart,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type {
  BookingStatus,
  Court,
  Booking as PrismaBooking,
  Coupon,
  User as PrismaUser,
} from "@prisma/client";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { Spinner } from "./Spinner";

// --- TIPOS ---
type CourtWithSport = Court & { sport: { name: string } };
export type BookingWithDetails = PrismaBooking & {
  court: { id: string; name: string; slotDurationMinutes: number };
  user?: { name: string | null; phone: string | null } | null;
  coupon?: Coupon | null;
};

export type SubmitPayload = {
  bookingId?: string;
  guestName: string;
  guestPhone?: string;
  courtId: string;
  time: string;
  status: BookingStatus;
  depositPaid: number;
};

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitPayload) => void;
  onUpdateStatus: (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO"
  ) => void;
  courts: CourtWithSport[];
  timeSlots: string[];
  initialBooking?: BookingWithDetails | null;
  initialSlot?: { courtId: string; time: string } | null;
  existingBookings: BookingWithDetails[];
  isSubmitting?: boolean;
}

const InfoRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4 py-3">
    <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="text-base font-semibold text-gray-800">{children}</div>
    </div>
  </div>
);
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    value
  );

const BookingFormModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdateStatus,
  courts,
  timeSlots,
  initialBooking,
  initialSlot,
  existingBookings,
  isSubmitting,
}) => {
  const [mode, setMode] = useState<"view" | "form">(
    initialBooking ? "view" : "form"
  );
  const [formData, setFormData] = useState<SubmitPayload>({
    guestName: "",
    guestPhone: "",
    courtId: courts[0]?.id || "",
    time: timeSlots[0] || "09:00",
    status: "CONFIRMADO",
    depositPaid: 0,
  });
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialBooking) {
        setMode("view");
        setFormData({
          bookingId: initialBooking.id,
          guestName:
            initialBooking.guestName || initialBooking.user?.name || "",
          guestPhone:
            initialBooking.guestPhone || initialBooking.user?.phone || "",
          courtId: initialBooking.courtId,
          time: `${String(initialBooking.startTime).padStart(2, "0")}:${String(
            initialBooking.startMinute || 0
          ).padStart(2, "0")}`,
          status: initialBooking.status,
          depositPaid: initialBooking.depositPaid,
        });
      } else if (initialSlot) {
        setMode("form");
        setFormData({
          guestName: "",
          guestPhone: "",
          courtId: initialSlot.courtId,
          time: initialSlot.time,
          status: "CONFIRMADO",
          depositPaid: 0,
        });
      }
    }
  }, [isOpen, initialBooking, initialSlot, courts, timeSlots]);

  useEffect(() => {
    if (!isOpen || mode !== "form") {
      setWarning(null);
      return;
    }

    const selectedCourt = courts.find((c) => c.id === formData.courtId);
    if (!selectedCourt) return;

    const [hour, minute] = formData.time.split(":").map(Number);
    const newStartMinutes = hour * 60 + minute;
    const newEndMinutes = newStartMinutes + selectedCourt.slotDurationMinutes;

    const overlap = existingBookings.find((booking) => {
      if (initialBooking && booking.id === initialBooking.id) return false;
      if (booking.court.id !== formData.courtId) return false;

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
    mode,
    initialBooking,
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
      toast.error("El nombre del cliente es obligatorio.");
      return;
    }
    if (warning) {
      toast.error(warning);
      return;
    }
    await onSubmit(formData);
  };

  // --- SUB-COMPONENTE: VISTA DE DETALLES ---
  const DetailsView = () => {
    if (!initialBooking) return null;
    const customerName =
      initialBooking.user?.name || initialBooking.guestName || "Cliente";
    const customerPhone =
      initialBooking.user?.phone || initialBooking.guestPhone;
    const finalPrice = initialBooking.totalPrice;
    const discountAmount = initialBooking.coupon
      ? initialBooking.coupon.discountType === "PERCENTAGE"
        ? (finalPrice / (1 - initialBooking.coupon.discountValue / 100)) *
          (initialBooking.coupon.discountValue / 100)
        : initialBooking.coupon.discountValue
      : 0;
    const originalPrice = finalPrice + discountAmount;

    return (
      <>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detalles de la Reserva
            </h2>
            <p className="text-sm text-gray-500">ID: {initialBooking.id}</p>
          </div>
          <Button variant="outline" onClick={() => setMode("form")}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-2">
              <InfoRow icon={User} label="Cliente">
                {customerName}
              </InfoRow>
              {customerPhone && (
                <InfoRow icon={Phone} label="Teléfono">
                  <a
                    href={`https://wa.me/${customerPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" hover:underline"
                  >
                    {customerPhone}
                  </a>
                </InfoRow>
              )}
              <InfoRow icon={Calendar} label="Fecha">
                {format(new Date(initialBooking.date), "eeee, dd 'de' MMMM", {
                  locale: es,
                })}
              </InfoRow>
              <InfoRow icon={Clock} label="Horario">
                {`${String(initialBooking.startTime).padStart(2, "0")}:${String(
                  initialBooking.startMinute || 0
                ).padStart(2, "0")}`}{" "}
                hs
              </InfoRow>
            </div>
            <div className="space-y-2">
              <InfoRow icon={DollarSign} label="Estado del Pago">
                <span
                  className={cn(
                    "px-2 py-1 text-xs font-bold rounded-full",
                    initialBooking.status === "CONFIRMADO"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  )}
                >
                  {initialBooking.status === "CONFIRMADO"
                    ? "Seña Pagada"
                    : initialBooking.status.charAt(0) +
                      initialBooking.status.slice(1).toLowerCase()}
                </span>
              </InfoRow>
              <InfoRow icon={DollarSign} label="Detalle de Precios">
                {initialBooking.coupon ? (
                  <>
                    <p>Precio Original: {formatCurrency(originalPrice)}</p>
                    <p className="text-green-600">
                      Descuento ({initialBooking.coupon.code}): -
                      {formatCurrency(discountAmount)}
                    </p>
                    <p className="font-bold">
                      Precio Final: {formatCurrency(finalPrice)}
                    </p>
                  </>
                ) : (
                  <p>{formatCurrency(initialBooking.totalPrice)}</p>
                )}
              </InfoRow>
              <InfoRow icon={DollarSign} label="Pagado">
                {formatCurrency(initialBooking.depositPaid)}
              </InfoRow>
              <InfoRow icon={DollarSign} label="Saldo Pendiente">
                <span className="font-bold">
                  {formatCurrency(initialBooking.remainingBalance)}
                </span>
              </InfoRow>
            </div>
          </div>
          {initialBooking.coupon && (
            <div className="mt-6">
              <InfoRow icon={Tag} label="Cupón Utilizado">
                <div className="flex flex-col">
                  <span className="font-mono text-base">
                    {initialBooking.coupon.code}
                  </span>
                  <span className="text-xs text-gray-500">
                    {initialBooking.coupon.description}
                  </span>
                </div>
              </InfoRow>
            </div>
          )}
        </div>
        <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex gap-2">
            {initialBooking.status !== "CANCELADO" && (
              <Button
                variant="destructive"
                onClick={() => onUpdateStatus(initialBooking.id, "CANCELADO")}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
            {initialBooking.status === "CONFIRMADO" && (
              <Button
                onClick={() => onUpdateStatus(initialBooking.id, "COMPLETADO")}
              >
                <BadgeCheck className="mr-2 h-4 w-4" />
                Completada
              </Button>
            )}
          </div>
        </div>
      </>
    );
  };

  // --- SUB-COMPONENTE: VISTA DE FORMULARIO ---
  const FormView = () => (
    <>
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">
          {initialBooking ? "Editar Reserva" : "Nueva Reserva"}
        </h2>
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
      >
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
        <div>
          <label
            htmlFor="guestPhone"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            <Phone className="inline-block w-4 h-4 mr-1" /> Teléfono Cliente
            (Opcional)
          </label>
          <input
            type="text"
            id="guestPhone"
            name="guestPhone"
            value={formData.guestPhone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="3491123456"
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
              <DollarSign className="inline-block w-4 h-4 mr-1" /> Seña Pagada
              (ARS)
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : initialBooking ? (
              "Actualizar Reserva"
            ) : (
              "Crear Reserva"
            )}
          </Button>
        </div>
      </form>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {mode === "view" ? <DetailsView /> : <FormView />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingFormModal;
