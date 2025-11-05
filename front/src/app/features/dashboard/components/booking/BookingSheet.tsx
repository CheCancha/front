"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import { toast } from "react-hot-toast";
import {
  BookingWithDetails,
  CourtWithSport,
} from "@/shared/entities/complex/types";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { BookingViewManager } from "./BookingViewManager";
import { BookingFormView } from "./BookingFormView";
import { BookingPlayerWithUser } from "@/shared/entities/booking/bookingTypes";
import { formatCurrency } from "@/shared/helper/formatCurrency";

// --- TIPOS ---
export type SubmitPayload = {
  bookingId?: string;
  guestName: string;
  guestPhone?: string;
  courtId: string;
  time: string;
  status: BookingStatus;
  depositPaid: number;
  paymentMethod: PaymentMethod | "";
};

export interface BookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdate: () => void;
  onPlayerRemoved: (playerId: string) => void;
  onUpdateStatus: (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO",
    loadingToastId?: string,
    finalPaymentAmount?: number
  ) => void;
  initialBooking?: BookingWithDetails | null;

  onSubmit: (data: SubmitPayload) => void;
  courts: CourtWithSport[];
  timeSlots: string[];
  initialSlot?: { courtId: string; time: string } | null;
  existingBookings: BookingWithDetails[];
  isSubmitting?: boolean;
  currentDate: Date;
}

const BookingSheet: React.FC<BookingSheetProps> = ({
  isOpen,
  onClose,
  onBookingUpdate,
  onUpdateStatus,
  initialBooking: booking,
  initialSlot,
  courts,
  timeSlots,
  isSubmitting,
  onSubmit,
}) => {
  // --- ESTADOS ---
  const [players, setPlayers] = useState<BookingPlayerWithUser[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [paymentModalData, setPaymentModalData] =
    useState<BookingPlayerWithUser | null>(null);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  const [depositPaidInput, setDepositPaidInput] = useState("0");
  const [warning, setWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<SubmitPayload, "depositPaid">>({
    guestName: "",
    guestPhone: "",
    courtId: "",
    time: "",
    status: "CONFIRMADO",
    paymentMethod: "EFECTIVO",
  });

  // Efecto para cargar los jugadores y OBTENER DATOS INICIALES DEL FORMULARIO
  useEffect(() => {
    if (!isOpen) {
      setWarning(null);
      setPlayers([]);
      setIsLoadingPlayers(true);
      return;
    }

    if (booking) {
      console.log(
        `[BookingSheet] Abriendo modal para reserva existente. 
        ID: ${booking.id}, 
        totalPrice (en BD/centavos): ${booking.totalPrice}`
      );
      setIsLoadingPlayers(true);
      fetch(`/api/bookings/${booking.id}/players`)
        .then((res) => res.json())
        .then((data) => {
          setPlayers(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al cargar la lista de jugadores.");
        })
        .finally(() => setIsLoadingPlayers(false));
    } else if (initialSlot) {
      // MODO CREACIÓN
      setFormData((prev) => ({
        ...prev,
        guestName: "",
        guestPhone: "",
        courtId: initialSlot.courtId,
        time: initialSlot.time,
        status: "CONFIRMADO",
        paymentMethod: "EFECTIVO",
      }));
      setDepositPaidInput("0");
      setIsLoadingPlayers(false); // No hay jugadores que cargar
    } else {
      // MODO SIN DATOS (Limpieza)
      setFormData({
        guestName: "",
        guestPhone: "",
        courtId: "",
        time: "",
        status: "CONFIRMADO",
        paymentMethod: "EFECTIVO",
      });
      setDepositPaidInput("0");
      setIsLoadingPlayers(false);
    }
  }, [isOpen, booking, initialSlot]);

  // --- CÁLCULO DE PAGOS (ZONA SEGURA DEL HOOK) ---
  const totalPaidByPlayers = useMemo(() => {
    if (!booking || players.length === 0) return 0;
    return players.reduce((sum, player) => sum + player.amountPaid, 0);
  }, [players, booking]);

  const totalPagadoFinal = totalPaidByPlayers;
  const saldoPendienteFinal = booking?.totalPrice
    ? booking.totalPrice - totalPagadoFinal
    : 0;

  // 2. Handlers que usa FormView
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
    // Lógica para el submit
    const depositPaid = parseFloat(depositPaidInput) || 0;
    onSubmit({ ...formData, depositPaid });
  };

  const handlePlayerAdded = useCallback(
    (newPlayer: BookingPlayerWithUser) => {
      setPlayers((currentPlayers) => [...currentPlayers, newPlayer]);
      onBookingUpdate();
    },
    [onBookingUpdate]
  );

  const handleRemovePlayer = async (playerId: string) => {
    if (!booking) return;
    try {
      const res = await fetch(
        `/api/bookings/${booking.id}/players?playerId=${playerId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error al eliminar jugador");
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      toast.success("Jugador eliminado con éxito.");
      onBookingUpdate();
    } catch {
      toast.error("Error desconocido al eliminar jugador.");
    }
  };

  // --- Helpers para mostrar datos ---
  const customerName = booking?.user?.name || booking?.guestName || "Cliente";
  const customerPhone = booking?.user?.phone ?? booking?.guestPhone ?? null;

  const paymentMethodNames = {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    ONLINE: "Online",
    OTRO: "Otro",
  };

  const isViewingExisting = !!booking;
  const isCreatingNew = !booking;

  // --- Handlers de API (Se quedan en el padre) ---
  const handlePaymentSubmit = async ({
    amount,
    paymentMethod,
    bookingPlayerId,
  }: {
    amount: number;
    paymentMethod: PaymentMethod;
    bookingPlayerId?: string;
  }) => {
    const playerId = bookingPlayerId || paymentModalData?.id;
    if (!playerId || !booking) {
      throw new Error(
        "ID de jugador o reserva no definido en handlePaymentSubmit."
      );
    }

    setIsPaymentSubmitting(true);

    try {
      const response = await fetch(`/api/bookings/player-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingPlayerId: playerId,
          amount: amount,
          paymentMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el pago.");
      }

      const updatedPlayer: BookingPlayerWithUser = await response.json();

      setPlayers((prev) =>
        prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
      );

      toast.success("Pago registrado con éxito y totales actualizados.");
      onBookingUpdate();
      setPaymentModalData(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error desconocido al pagar."
      );
      throw error;
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  const handleCompleteAndPayRemaining = async () => {
    if (!booking) {
      console.log("[LOG-COMPLETAR] ERROR: Booking no definido.");
      return;
    } // 1. Obtener el monto pendiente de pago (calculado en el useMemo)

    if (isLoadingPlayers) {
      toast.error("Espera a que los jugadores terminen de cargar.");
      console.log("[LOG-COMPLETAR] FLUJO DETENIDO: isLoadingPlayers es true.");
      return;
    }

    const remainingToPay = saldoPendienteFinal;
    console.log(`[LOG-COMPLETAR] Saldo Pendiente: ${remainingToPay}`);

    if (remainingToPay < 0) {
      toast.error(
        `Error: Hay un sobrante de ${formatCurrency(Math.abs(remainingToPay))}.`
      );
      console.log("[LOG-COMPLETAR] FLUJO DETENIDO: Sobrante detectado.");
      return;
    }

    const loadingToastId = toast.loading(
      "Procesando pago y completando reserva..."
    );

    if (remainingToPay > 0) {
      console.log("[LOG-COMPLETAR] INICIANDO PAGO FINAL.");

      const mainPlayer =
        players.find((p) => p.userId === booking.userId) ||
        players.find((p) => p.bookingId === booking.id) ||
        players[0];

      if (mainPlayer) {
        // --- FLUJO ÚNICO Y CORRECTO ---
        console.log(
          `[LOG-COMPLETAR] (Flujo Unificado) Asignando ${remainingToPay} a jugador ID: ${mainPlayer.id}`
        );
        try {
          const amountInPesos = remainingToPay / 100;
          await handlePaymentSubmit({
            amount: amountInPesos,
            paymentMethod: PaymentMethod.EFECTIVO,
            bookingPlayerId: mainPlayer.id,
          });
          console.log("[LOG-COMPLETAR] PAGO FINAL (Jugador) EXITOSO.");
        } catch (error) {
          toast.dismiss(loadingToastId);
          console.log("[LOG-COMPLETAR] PAGO FINAL (Jugador) FALLÓ.");
          return;
        }
      } else {
        // --- CASO 2 (AHORA ES UN ERROR) ---
        // Si llegamos aquí, es un estado inconsistente:
        // Se debe pagar (remainingToPay > 0) pero no hay a quién asignarle el pago.
        console.error(
          `[LOG-COMPLETAR] (Caso 2: ERROR) No se encontró jugador para asignar el pago. Abortando.`
        );
        toast.dismiss(loadingToastId);
        toast.error(
          "Error: No hay ningún jugador en la reserva a quien asignarle el pago."
        );
        return; // Detiene la ejecución
      }
    }

    // 2. MARCAR LA RESERVA COMO COMPLETADA
    // (Solo se ejecuta si el pago fue exitoso o si remainingToPay era 0)
    console.log(
      `[LOG-COMPLETAR] (Flujo unificado) Llamando a onUpdateStatus para Booking ID: ${booking.id}`
    );
    // Ya no pasamos 'remainingToPay' aquí
    onUpdateStatus(booking.id, "COMPLETADO", loadingToastId);
    console.log("[LOG-COMPLETAR] FLUJO FINALIZADO CON ÉXITO.");
  };

  if (!isViewingExisting && !isCreatingNew) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="flex flex-col w-full sm:max-w-lg">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              {/* Usamos tus variables para poner el título dinámicamente */}
              {isViewingExisting ? "Detalles de la Reserva" : "Nueva Reserva"}
            </SheetTitle>
            <SheetDescription>
              {isViewingExisting
                ? "Gestiona los jugadores y pagos de este turno."
                : "Completa los datos para crear una nueva reserva."}
            </SheetDescription>
          </SheetHeader>
          {/* === MODO CREACIÓN (Formulario Completo) === */}
          {isCreatingNew && (
            <BookingFormView
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
              initialSlot={initialSlot || null}
            />
          )}
          {/* === MODO GESTIÓN (Detalles y Jugadores) === */}
          {isViewingExisting && (
            <BookingViewManager
              booking={booking}
              players={players}
              isLoadingPlayers={isLoadingPlayers}
              totalPagadoFinal={totalPagadoFinal}
              saldoPendienteFinal={saldoPendienteFinal}
              onPaymentStart={setPaymentModalData}
              onDeletePlayer={handleRemovePlayer}
              onAddPlayer={handlePlayerAdded}
              onUpdateStatus={onUpdateStatus}
              onBookingUpdate={onBookingUpdate}
              onCompleteBooking={handleCompleteAndPayRemaining}
              customerName={customerName}
              customerPhone={customerPhone}
              paymentMethodNames={paymentMethodNames}
            />
          )}
        </SheetContent>
      </Sheet>
      {!!paymentModalData && (
        <RegisterPaymentModal
          player={paymentModalData}
          onSubmit={handlePaymentSubmit}
          isOpen={!!paymentModalData}
          onClose={() => setPaymentModalData(null)}
          isSubmitting={isPaymentSubmitting}
        />
      )}
    </>
  );
};

export default BookingSheet;
