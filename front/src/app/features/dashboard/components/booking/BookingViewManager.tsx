import { Separator } from "@/shared/components/ui/separator";
import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { BookingPlayerWithUser } from "@/shared/entities/booking/bookingTypes";
import { BookingWithDetails } from "@/shared/entities/complex/types";
import React, { memo } from "react";
import { PlayerCard } from "./PlayerCard";
import { AddPlayerForm } from "./AddPlayerForm";
import { InfoRow } from "./InfoRow";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Spinner } from "@/shared/components/ui/Spinner";
import { formatCurrency } from "@/shared/helper/formatCurrency";
import { Button } from "@/shared/components/ui/button";
import {
  BadgeCheck,
  Ban,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  Tag,
  User,
} from "lucide-react";

interface BookingViewManagerProps {
  booking: BookingWithDetails;
  players: BookingPlayerWithUser[];
  isLoadingPlayers: boolean;
  totalPagadoFinal: number;
  saldoPendienteFinal: number;
  onBookingUpdate: () => void;
  onPaymentStart: (player: BookingPlayerWithUser) => void;
  onDeletePlayer: (playerId: string) => void;
  onAddPlayer: (newPlayer: BookingPlayerWithUser) => void;
  onUpdateStatus: (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO"
  ) => void;
  onCompleteBooking: () => Promise<void>;
  customerName: string;
  customerPhone: string | null;
  paymentMethodNames: { [key: string]: string };
}

export const BookingViewManager = memo(
  ({
    booking,
    players,
    isLoadingPlayers,
    totalPagadoFinal,
    saldoPendienteFinal,
    onBookingUpdate,
    onPaymentStart,
    onDeletePlayer,
    onAddPlayer,
    onUpdateStatus,
    onCompleteBooking,
    customerName,
    customerPhone,
    paymentMethodNames,
  }: BookingViewManagerProps) => {
    return (
      <>
        {/* === CONTENIDO (con scroll) === */}
        <div className="h-full flex-1 overflow-y-auto space-y-2 px-4">
          {/* --- 1. Detalles Principales --- */}
          <section className="space-y-2">
            <div>
            <h3 className="text-lg font-switzer font-semibold text-gray-800">
              Reserva
            </h3>
            <span className="text-sm">{`ID: ${booking.id.substring(0, 8)}`}</span>
            </div>

            {/* Primera fila: cliente + teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow icon={User} label="Cliente Principal">
                {customerName}
              </InfoRow>

              {customerPhone && (
                <InfoRow icon={Phone} label="Teléfono">
                  {customerPhone}
                </InfoRow>
              )}
            </div>

            {/* Segunda fila: fecha + hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow icon={Calendar} label="Fecha">
                {format(new Date(booking.date), "eeee dd 'de' MMM", {
                  locale: es,
                })}
              </InfoRow>

              <InfoRow icon={Clock} label="Horario">
                {`${String(booking.startTime).padStart(2, "0")}:${String(
                  booking.startMinute || 0
                ).padStart(2, "0")} hs`}
              </InfoRow>
            </div>

            {/* TERCERA FILA AÑADIDA: PRECIO Y MÉTODO DE PAGO DE SEÑA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {booking.paymentMethod && (
                <InfoRow icon={Tag} label="Método Pago">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark">
                    {booking.paymentMethod === "EFECTIVO"
                      ? "Efectivo"
                      : "Transferencia"}
                  </span>
                </InfoRow>
              )}

              {booking.depositPaid > 0 && (
                <InfoRow icon={DollarSign} label="Seña">
                  <span className="font-bold text-green-600">
                    {formatCurrency(booking.totalPaid)}
                  </span>
                </InfoRow>
              )}
            </div>
          </section>

          <Separator />

          {/* --- 2. Sección de Jugadores --- */}
          <section className="space-y-2">
            <h3 className="text-lg font-switzer font-semibold text-gray-800">
              Jugadores
            </h3>
            <div className="space-y-2">
              {isLoadingPlayers && <Spinner />}
              {!isLoadingPlayers && players.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay jugadores adicionales añadidos.
                </p>
              )}
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onPaymentStart={onPaymentStart}
                  onDelete={onDeletePlayer}
                />
              ))}
            </div>
            <AddPlayerForm bookingId={booking.id} onPlayerAdded={onAddPlayer} />
          </section>

          <Separator />

          {/* --- 3. Resumen de Pagos --- */}
          <section className="space-y-2">
            <h3 className="text-lg font-switzer font-semibold text-gray-800">
              Pagos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow icon={DollarSign} label="Precio Total">
                {formatCurrency(booking.totalPrice)}   
              </InfoRow>
              <InfoRow icon={DollarSign} label="Total Pagado">
                <span className="font-bold text-green-600">
                  {formatCurrency(totalPagadoFinal)} 
                </span>
              </InfoRow>
            </div>

            <InfoRow icon={DollarSign} label="Saldo Pendiente">
              <span className="font-bold text-lg">
                {formatCurrency(saldoPendienteFinal)}
              </span>
            </InfoRow>
          </section>
        </div>

        {/* === FOOTER (Acciones) === */}
        <SheetFooter className="pt-4 border-t">
          <div className="flex w-full justify-between items-center">
            <SheetClose asChild>
              <Button variant="ghost">Cerrar</Button>
            </SheetClose>
            <div className="flex gap-2">
              {booking.status !== "CANCELADO" && (
                <Button
                  variant="destructive"
                  onClick={() => onUpdateStatus(booking.id, "CANCELADO")}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
              {booking.status !== "CANCELADO" &&
                booking.status !== "COMPLETADO" && (
                  <Button onClick={onCompleteBooking}>
                    <BadgeCheck className="mr-1 h-4 w-4" />
                    Completada
                  </Button>
                )}
            </div>
          </div>
        </SheetFooter>
      </>
    );
  }
);

BookingViewManager.displayName = "BookingViewManager";
