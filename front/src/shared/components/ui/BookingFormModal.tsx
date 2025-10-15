"use client";

import React, { useEffect, useState, memo, useCallback, useMemo } from "react";
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
import { Input } from "@/shared/components/ui/inputshadcn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type {
  BookingStatus,
  Court,
  Booking as PrismaBooking,
  Coupon,
} from "@prisma/client";
import { toast } from "react-hot-toast";
import { format, isToday } from "date-fns";
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
  currentDate: Date;
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
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    value
  );
const DetailsView = memo(
  ({
    initialBooking,
    onClose,
    onUpdateStatus,
    setMode,
  }: {
    initialBooking: BookingWithDetails;
    onClose: () => void;
    onUpdateStatus: (
      bookingId: string,
      status: "COMPLETADO" | "CANCELADO"
    ) => void;
    setMode: (mode: "form") => void;
  }) => {
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
    const remainingBalance =
      initialBooking.totalPrice - initialBooking.depositPaid;

    return (
      <>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-brand-dark">
              Detalles de la Reserva
            </h2>
            <p className="text-sm text-gray-500">
              ID: {initialBooking.id.substring(0, 8)}
            </p>
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
                ).padStart(2, "0")}`}
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
                  {formatCurrency(remainingBalance)}
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
  }
);
DetailsView.displayName = "DetailsView";

interface FormViewProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: Omit<SubmitPayload, "depositPaid">;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (
    name: keyof Omit<SubmitPayload, "depositPaid" | "guestPhone">,
    value: string
  ) => void;
  depositPaidInput: string;
  setDepositPaidInput: (value: string) => void;
  courts: CourtWithSport[];
  timeSlots: string[];
  warning: string | null;
  onClose: () => void;
  isSubmitting?: boolean;
  initialBooking?: BookingWithDetails | null;
  initialSlot?: { courtId: string; time: string } | null;
}

const FormView = memo(
  ({
    handleSubmit,
    formData,
    handleChange,
    handleSelectChange,
    depositPaidInput,
    setDepositPaidInput,
    courts,
    timeSlots,
    warning,
    onClose,
    isSubmitting,
    initialBooking,
    initialSlot,
  }: FormViewProps) => {
    const selectedCourtName = useMemo(() => {
      if (!initialSlot) return "";
      return courts.find((c) => c.id === initialSlot.courtId)?.name || "";
    }, [initialSlot, courts]);

    const isCreatingFromSlot = initialSlot && !initialBooking;

    return (
      <>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-brand-dark">
            {initialBooking ? "Editar Reserva" : "Nueva Reserva"}
          </h2>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4 overflow-y-auto"
        >
          <div>
            <label
              htmlFor="guestName"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              <User className="inline-block w-4 h-4 mr-1" /> Nombre Cliente
            </label>
            <Input
              type="text"
              id="guestName"
              name="guestName"
              value={formData.guestName}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
            />
          </div>
          <div>
            <label
              htmlFor="guestPhone"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              <Phone className="inline-block w-4 h-4 mr-1" /> Teléfono
              (Opcional)
            </label>
            <Input
              type="text"
              id="guestPhone"
              name="guestPhone"
              value={formData.guestPhone || ""}
              onChange={handleChange}
              placeholder="3491123456"
            />
          </div>

          {isCreatingFromSlot ? (
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={List} label="Cancha">
                {selectedCourtName}
              </InfoRow>
              <InfoRow icon={Clock} label="Horario">
                {initialSlot.time} hs
              </InfoRow>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="courtId"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  <List className="inline-block w-4 h-4 mr-1" />
                  Cancha
                </label>
                <Select
                  value={formData.courtId}
                  onValueChange={(value) =>
                    handleSelectChange("courtId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cancha" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  Horario
                </label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => handleSelectChange("time", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                <BarChart className="inline-block w-4 h-4 mr-1" /> Estado
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleSelectChange("status", value as BookingStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="COMPLETADO">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="depositPaid"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                <DollarSign className="inline-block w-4 h-4 mr-1" /> Seña Pagada
              </label>
              <Input
                type="number"
                id="depositPaid"
                name="depositPaid"
                value={depositPaidInput}
                onChange={(e) => setDepositPaidInput(e.target.value)}
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
            <Button type="submit" disabled={isSubmitting || !!warning}>
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
  }
);

FormView.displayName = "FormView";

// --- COMPONENTE PRINCIPAL ---
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
  currentDate,
}) => {
  const [mode, setMode] = useState<"view" | "form">("form");
  const [formData, setFormData] = useState<Omit<SubmitPayload, "depositPaid">>({
    guestName: "",
    guestPhone: "",
    courtId: "",
    time: "",
    status: "CONFIRMADO",
  });
  const [depositPaidInput, setDepositPaidInput] = useState("0");
  const [warning, setWarning] = useState<string | null>(null);

  const normalizeTime = useCallback((time: string | undefined | null) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    return `${String(h).padStart(2, "0")}:${String(m || "00").padStart(
      2,
      "0"
    )}`;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialBooking) {
      setMode("view");
      const bookingTime = `${String(initialBooking.startTime).padStart(
        2,
        "0"
      )}:${String(initialBooking.startMinute || 0).padStart(2, "0")}`;
      setFormData({
        bookingId: initialBooking.id,
        guestName: initialBooking.guestName || initialBooking.user?.name || "",
        guestPhone:
          initialBooking.guestPhone || initialBooking.user?.phone || "",
        courtId: initialBooking.courtId,
        time: bookingTime,
        status: initialBooking.status,
      });
      setDepositPaidInput(String(initialBooking.depositPaid));
    } else {
      setMode("form");
      setFormData({
        guestName: "",
        guestPhone: "",
        courtId: initialSlot?.courtId || courts[0]?.id || "",
        time: normalizeTime(initialSlot?.time) || timeSlots[0] || "",
        status: "CONFIRMADO",
      });
      setDepositPaidInput("0");
    }
  }, [isOpen, initialBooking, initialSlot, courts, timeSlots, normalizeTime]);

  useEffect(() => {
    if (!isOpen || mode !== "form") {
      setWarning(null);
      return;
    }

    let timeIsPast = false;
    // --- MODIFICACIÓN CLAVE ---
    // Solo se valida si el horario ya pasó si se está CREANDO una nueva reserva.
    // Si se está EDITANDO (initialBooking existe), se salta esta validación.
    if (!initialBooking && isToday(currentDate) && formData.time) {
      const [slotHour, slotMinute] = formData.time.split(":").map(Number);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (
        slotHour < currentHour ||
        (slotHour === currentHour && slotMinute < currentMinute)
      ) {
        setWarning("No se puede seleccionar un horario que ya ha pasado.");
        timeIsPast = true;
      }
    }

    if (timeIsPast) return;

    const selectedCourt = courts.find((c) => c.id === formData.courtId);
    if (!selectedCourt) {
      setWarning(null);
      return;
    }

    if (!formData.time) {
      setWarning(null);
      return;
    }

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
    setWarning(
      overlap ? "¡Atención! Este horario se superpone con otra reserva." : null
    );
  }, [
    formData.courtId,
    formData.time,
    existingBookings,
    isOpen,
    mode,
    initialBooking,
    courts,
    currentDate,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    name: keyof Omit<SubmitPayload, "depositPaid" | "guestPhone">,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value as BookingStatus | string,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.guestName.trim() === "") {
      toast.error("El nombre del cliente es obligatorio.");
      return;
    }
    if (warning) {
      toast.error(warning);
      return;
    }
    const depositPaid = parseFloat(depositPaidInput) || 0;
    onSubmit({ ...formData, depositPaid });
  };

  useEffect(() => {
    console.log("🧩 initialSlot recibido:", initialSlot);
    console.log("📋 formData actual:", formData);
  }, [initialSlot, formData]);

  console.log("initialSlot:", initialSlot);
  console.log("timeSlots:", timeSlots);
  console.log("formData.time:", formData.time);

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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {mode === "view" && initialBooking ? (
              <DetailsView
                initialBooking={initialBooking}
                onClose={onClose}
                onUpdateStatus={onUpdateStatus}
                setMode={setMode}
              />
            ) : (
              <FormView
                handleSubmit={handleSubmit}
                formData={formData}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
                depositPaidInput={depositPaidInput}
                setDepositPaidInput={setDepositPaidInput}
                courts={courts}
                timeSlots={timeSlots}
                warning={warning}
                onClose={onClose}
                isSubmitting={isSubmitting}
                initialBooking={initialBooking}
                initialSlot={initialSlot}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingFormModal;
