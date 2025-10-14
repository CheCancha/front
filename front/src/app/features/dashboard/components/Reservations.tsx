"use client";

import React, { useState, useEffect } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Frown } from "lucide-react";

// --- TIPOS ---
type UpcomingBooking = {
  id: string;
  guestName: string;
  courtName: string;
  date: Date;
  startTime: string;
  isPaid: boolean;
};

type RawApiResponse = Omit<UpcomingBooking, "date"> & {
  date: string;
};

// --- COMPONENTES AUXILIARES DE ESTADO ---
const ReservationsSkeleton = () => (
  <div className="space-y-2 py-2 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-3">
        <div className="w-12">
          <div className="h-4 bg-gray-200 rounded-md w-10/12 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded-md w-8/12 mx-auto mt-2"></div>
        </div>
        <div className="flex-grow">
          <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded-md w-1/4 mt-2"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      </div>
    ))}
  </div>
);

const NoReservationsMessage = () => (
  <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-full">
    <Clock className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-bg-brand-dark">
      No hay próximos turnos
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      No hay reservas confirmadas para los próximos días.
    </p>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-full text-red-600">
    <Frown className="mx-auto h-12 w-12" />
    <h3 className="mt-2 text-sm font-semibold">Error al cargar los turnos</h3>
    <p className="mt-1 text-sm text-red-500">{message}</p>
  </div>
);

// --- LÓGICA AUXILIAR ---
const formatDateLabel = (date: Date) => {
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return format(date, "eee dd", { locale: es });
};

// --- COMPONENTE PRINCIPAL ---
export function Reservations({ complexId }: { complexId: string }) {
  const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!complexId) {
      setIsLoading(false);
      setError("ID del complejo no proporcionado.");
      return;
    }

    const fetchUpcomingBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/complex/${complexId}/bookings?upcoming=true`
        );

        if (!res.ok) {
          throw new Error("No se pudo conectar con el servidor.");
        }

        const rawBookings: RawApiResponse[] = await res.json();

        const formattedBookings = rawBookings.map((b) => ({
          ...b,
          date: new Date(b.date),
        }));

        setBookings(formattedBookings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocurrió un error desconocido."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingBookings();
  }, [complexId]);

  const renderContent = () => {
    if (isLoading) {
      return <ReservationsSkeleton />;
    }
    if (error) {
      return <ErrorMessage message={error} />;
    }
    if (bookings.length === 0) {
      return <NoReservationsMessage />;
    }
    return (
      <ul className="divide-y divide-gray-200 overflow-y-auto pr-2 flex-grow">
        {bookings.map((res) => (
          <li key={res.id} className="py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-center w-12 shrink-0">
                <p className="font-bold text-sm uppercase text-brand-orange">
                  {formatDateLabel(res.date)}
                </p>
                <p className="font-medium text-gray-800">{res.startTime}</p>
              </div>
              <div>
                <p className="font-medium">{res.guestName}</p>
                <p className="text-sm text-gray-500">{res.courtName}</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                res.isPaid
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {res.isPaid ? "Pago Total" : "Seña Pagada"}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col h-full max-h-[500px] lg:max-h-full">
      <h2 className="text-lg font-semibold mb-4">Próximos 10 Turnos</h2>
      {renderContent()}
    </div>
  );
}
