"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Frown } from "lucide-react";
import type { Booking } from "@prisma/client";

// --- TIPOS ---
type BookingWithCourt = Booking & {
  court: {
    name: string;
  };
};

// --- COMPONENTES AUXILIARES ---

// Skeleton para el estado de carga
const ReservationsSkeleton = () => (
  <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded-md w-1/3 mb-4"></div>
    <ul className="space-y-4">
      <li className="h-12 bg-gray-100 rounded-md"></li>
      <li className="h-12 bg-gray-100 rounded-md"></li>
      <li className="h-12 bg-gray-100 rounded-md"></li>
      <li className="h-12 bg-gray-100 rounded-md"></li>
    </ul>
  </div>
);

// Mensaje para cuando no hay turnos
const NoReservationsMessage = () => (
  <div className="text-center py-10 px-4">
    <Clock className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay próximos turnos</h3>
    <p className="mt-1 text-sm text-gray-500">No hay reservas pendientes para el resto del día.</p>
  </div>
);

// Mensaje de error
const ErrorMessage = ({ message }: { message: string }) => (
    <div className="text-center py-10 px-4">
      <Frown className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-red-900">Ocurrió un error</h3>
      <p className="mt-1 text-sm text-red-500">{message}</p>
    </div>
  );


// --- COMPONENTE PRINCIPAL ---

export function Reservations({ complexId }: { complexId: string }) {
  const [reservations, setReservations] = useState<BookingWithCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!complexId) {
        setIsLoading(false);
        setError("ID del complejo no proporcionado.");
        return;
    };

    const fetchUpcomingReservations = async () => {
      setIsLoading(true);
      setError(null);
      const todayString = format(new Date(), "yyyy-MM-dd");

      try {
        const res = await fetch(`/api/complex/${complexId}/bookings?date=${todayString}`);
        if (!res.ok) {
          throw new Error("No se pudieron cargar las reservas.");
        }
        const allTodayBookings: BookingWithCourt[] = await res.json();
        
        // Filtrar solo los turnos futuros y pendientes/confirmados
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        
        const upcomingBookings = allTodayBookings
          .filter(booking => {
            const bookingTotalMinutes = booking.startTime * 60 + (booking.startMinute || 0);
            const isFuture = bookingTotalMinutes >= currentTotalMinutes;
            const isValidStatus = booking.status === "PENDIENTE" || booking.status === "CONFIRMADO";
            return isFuture && isValidStatus;
          })
          .sort((a, b) => {
            const timeA = a.startTime * 60 + (a.startMinute || 0);
            const timeB = b.startTime * 60 + (b.startMinute || 0);
            return timeA - timeB;
          });

        setReservations(upcomingBookings);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingReservations();
  }, [complexId]);

  if (isLoading) {
    return <ReservationsSkeleton />;
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col max-h-[650px]">
      <h2 className="text-lg font-semibold mb-4">Próximos Turnos</h2>
      
      {error && <ErrorMessage message={error} />}
      
      {!error && reservations.length === 0 && <NoReservationsMessage />}

      {!error && reservations.length > 0 && (
        <ul className="divide-y divide-gray-200 overflow-y-auto pr-2 flex-grow">
          {reservations.map((res) => (
            <li key={res.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{res.guestName}</p>
                <p className="text-sm text-gray-500">{res.court.name}</p>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                {String(res.startTime).padStart(2, "0")}:{String(res.startMinute || 0).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}