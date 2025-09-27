import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock } from "lucide-react";

// --- TIPOS ---
type UpcomingBooking = {
  id: string;
  guestName: string;
  courtName: string;
  date: Date;
  startTime: string;
  isPaid: boolean;
};

// --- COMPONENTES AUXILIARES ---
const NoReservationsMessage = () => (
  <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-full">
    <Clock className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">
      No hay próximos turnos
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      No hay reservas confirmadas para los próximos días.
    </p>
  </div>
);

// Formateador de fecha relativo (Hoy, Mañana, o la fecha)
const formatDateLabel = (date: Date) => {
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return format(date, "eee dd", { locale: es });
};

// --- COMPONENTE PRINCIPAL ---
export function Reservations({ bookings }: { bookings: UpcomingBooking[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col h-full max-h-[500px] lg:max-h-full">
      <h2 className="text-lg font-semibold mb-4">Próximos 10 Turnos</h2>

      {bookings.length === 0 ? (
        <NoReservationsMessage />
      ) : (
        <ul className="divide-y divide-gray-200 overflow-y-auto pr-2 flex-grow">
          {bookings.map((res) => (
            <li key={res.id} className="py-3 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-center w-12">
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
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
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
      )}
    </div>
  );
}
