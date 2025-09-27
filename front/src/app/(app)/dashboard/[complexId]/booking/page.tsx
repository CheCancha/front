"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, PlusCircle } from "lucide-react";
import { format, add, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import type {
  Complex,
  Court,
  Booking as PrismaBooking,
  Sport,
  BookingStatus,
} from "@prisma/client";
import { toast } from "react-hot-toast";
import BookingFormModal from "@/shared/components/ui/BookingFormModal";

// --- TIPOS ---
type CourtWithSport = Court & {
  sport: Sport;
  priceRules: {
    id: string;
    startTime: number;
    endTime: number;
    price: number;
    depositAmount: number;
  }[];
};
type ComplexWithCourts = Complex & { courts: CourtWithSport[] };
type BookingWithCourtDuration = PrismaBooking & {
  court: { id: string; name: string; slotDurationMinutes: number };
};

type SubmitPayload = {
  guestName: string;
  courtId: string;
  time: string;
  status: BookingStatus;
  depositPaid: number;
  bookingId?: string;
  date?: string;
};

// --- SKELETON ---
const CalendarSkeleton = () => (
  <div className="flex-1 bg-gray-50 p-6 animate-pulse">
    <header className="mb-6 h-10 bg-gray-200 rounded-md w-full max-w-lg"></header>
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="grid grid-cols-4 min-w-[800px]">
        <div className="h-14 bg-gray-100 border-b border-l"></div>
        <div className="h-14 bg-gray-100 border-b border-l"></div>
        <div className="h-14 bg-gray-100 border-b border-l"></div>
        <div className="h-14 bg-gray-100 border-b border-l"></div>
      </div>
      <div className="h-96 bg-gray-50 border-l"></div>
    </div>
  </div>
);

// --- PÁGINA PRINCIPAL ---
export default function BookingCalendarPage() {
  const params = useParams();
  const complexId = params.complexId as string;

  const [complex, setComplex] = useState<ComplexWithCourts | null>(null);
  const [bookings, setBookings] = useState<BookingWithCourtDuration[]>([]);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [editingBooking, setEditingBooking] =
    useState<BookingWithCourtDuration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialValues, setModalInitialValues] = useState<
    { courtId: string; time: string } | undefined
  >();
  const [sportFilter, setSportFilter] = useState<string>("Todos");

  const timeSlots = useMemo(() => {
    if (!complex) return [];
    const slots = [];
    const open = complex.openHour ?? 9;
    const close = complex.closeHour ?? 23;
    for (let h = open; h < close; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    return slots;
  }, [complex]);

  const isSelectedDateToday = useMemo(
    () =>
      format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
    [currentDate]
  );
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const isPast = (time: string) => {
    if (!isSelectedDateToday) return false;
    const [slotHour, slotMinute] = time.split(":").map(Number);
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMinute < currentMinute) return true;
    return false;
  };

  const fetchBookingsForDate = useCallback(
    async (date: Date) => {
      if (!complexId) return;
      const dateString = format(date, "yyyy-MM-dd");
      try {
        const res = await fetch(
          `/api/complex/${complexId}/bookings?date=${dateString}`
        );
        if (!res.ok) throw new Error("Error al cargar las reservas.");
        const data = await res.json();
        setBookings(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error inesperado"
        );
      }
    },
    [complexId]
  );

  useEffect(() => {
    if (!complexId) return;
    const fetchComplexData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/complex/${complexId}/settings`);
        if (!res.ok) throw new Error("Error al cargar datos del complejo.");
        setComplex(await res.json());
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error inesperado"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplexData();
  }, [complexId]);

  useEffect(() => {
    if (complex) {
      fetchBookingsForDate(currentDate);
    }
  }, [complex, currentDate, fetchBookingsForDate]);

  const handleDateChange = (days: number) => {
    setCurrentDate((prev) => add(prev, { days }));
  };

  const handleGoToToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };

  const handleBookingSubmit = async (bookingData: SubmitPayload) => {
    const isEditing = !!editingBooking;
    const endpoint = `/api/complex/${complexId}/bookings`;
    const method = isEditing ? "PATCH" : "POST";
    const successMessage = isEditing ? "Reserva actualizada" : "Reserva creada";

    const body = isEditing
      ? bookingData
      : {
          ...bookingData,
          date: format(currentDate, "yyyy-MM-dd"),
        };

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ocurrió un error.");
      }

      const savedBooking = await response.json();

      if (isEditing) {
        setBookings((prev) =>
          prev.map((b) => (b.id === savedBooking.id ? savedBooking : b))
        );
      } else {
        setBookings((prev) =>
          [...prev, savedBooking].sort(
            (a, b) =>
              a.startTime - b.startTime ||
              (a.startMinute || 0) - (b.startMinute || 0)
          )
        );
      }

      toast.success(successMessage);
      setIsModalOpen(false);
      setEditingBooking(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la reserva."
      );
    }
  };

  const openModalForSlot = (courtId: string, time: string) => {
    setEditingBooking(null);
    setModalInitialValues({ courtId, time });
    setIsModalOpen(true);
  };

  const openModalForEdit = (booking: BookingWithCourtDuration) => {
    setEditingBooking(booking);
    setModalInitialValues(undefined);
    setIsModalOpen(true);
  };

  const { filteredCourts, sportFilters } = useMemo(() => {
    if (!complex) return { filteredCourts: [], sportFilters: [] };
    const sports = [
      "Todos",
      ...new Set(complex.courts.map((c) => c.sport.name)),
    ];
    const courts =
      sportFilter === "Todos"
        ? complex.courts
        : complex.courts.filter((c) => c.sport.name === sportFilter);
    return { filteredCourts: courts, sportFilters: sports };
  }, [complex, sportFilter]);

  const statusColors: Record<BookingStatus, string> = {
    CONFIRMADO: "bg-green-100 text-green-800 border-l-4 border-green-500",
    PENDIENTE: "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500",
    COMPLETADO: "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
    CANCELADO: "bg-red-100 text-red-800 border-l-4 border-red-500 opacity-70",
  };

  if (isLoading || !complex) return <CalendarSkeleton />;

  return (
    <>
      <div className="flex-1 bg-gray-50 p-4 sm:p-6">
        <header className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 self-start sm:self-center">
            <div className="flex items-center p-1 bg-white border rounded-lg shadow-sm">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-1.5 text-gray-500 hover:text-black"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-black flex items-center gap-2"
              >
                <Calendar size={16} /> Hoy
              </button>
              <button
                onClick={() => handleDateChange(1)}
                className="p-1.5 text-gray-500 hover:text-black"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <span className="font-semibold text-lg text-gray-800 capitalize">
              {format(currentDate, "eeee, dd MMMM", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center overflow-x-auto pb-2">
            {sportFilters.map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap",
                  sportFilter === sport
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border"
                )}
              >
                {sport}
              </button>
            ))}
          </div>
        </header>
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `minmax(80px, auto) repeat(${filteredCourts.length}, minmax(150px, 1fr))`,
              gridAutoRows: "2.5rem",
            }}
          >
            <div className="sticky top-0 left-0 bg-white z-10 flex items-center justify-center p-2 border-b border-r">
              <button
                onClick={() =>
                  openModalForSlot(filteredCourts[0]?.id, timeSlots[0])
                }
                className="flex items-center justify-center w-full h-full text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-md cursor-pointer"
                title="Añadir nueva reserva"
              >
                <PlusCircle size={16} />
              </button>
            </div>
            {filteredCourts.map((court) => (
              <div
                key={court.id}
                className="sticky top-0 text-center font-semibold p-3 border-b border-l bg-white z-10 flex items-center justify-center"
              >
                {court.name}
              </div>
            ))}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="sticky left-0 text-right text-xs font-mono text-gray-500 pr-2 border-r flex items-center justify-end bg-white">
                  {time}
                </div>
                {filteredCourts.map((court) => {
                  const slotStartMinutes =
                    parseInt(time.split(":")[0]) * 60 +
                    parseInt(time.split(":")[1]);
                  const bookingStartingNow = bookings.find(
                    (b) =>
                      b.courtId === court.id &&
                      b.startTime * 60 + (b.startMinute || 0) ===
                        slotStartMinutes
                  );

                  if (bookingStartingNow) {
                    const rowSpan =
                      bookingStartingNow.court.slotDurationMinutes / 30;
                    return (
                      <div
                        key={`${court.id}-${time}`}
                        className="relative border-b border-l p-1"
                        style={{ gridRow: `span ${rowSpan}` }}
                      >
                        <button
                          onClick={() => openModalForEdit(bookingStartingNow)}
                          className={cn(
                            "rounded-md w-full h-full p-2 text-left text-xs font-semibold cursor-pointer flex flex-col justify-start",
                            statusColors[bookingStartingNow.status]
                          )}
                        >
                          <span className="font-bold">
                            {bookingStartingNow.guestName ||
                              "Usuario Registrado"}
                          </span>
                          <span className="capitalize text-xs">
                            {bookingStartingNow.status.toLowerCase()}
                          </span>
                          <span className="mt-auto font-bold text-sm">
                            {bookingStartingNow.depositPaid.toLocaleString(
                              "es-AR",
                              { style: "currency", currency: "ARS" }
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  }

                  const isSlotCovered = bookings.some(
                    (b) =>
                      b.courtId === court.id &&
                      slotStartMinutes >=
                        b.startTime * 60 + (b.startMinute || 0) &&
                      slotStartMinutes <
                        b.startTime * 60 +
                          (b.startMinute || 0) +
                          b.court.slotDurationMinutes
                  );
                  if (isSlotCovered) return null;

                  const past = isPast(time);
                  return (
                    <div
                      key={`${court.id}-${time}`}
                      className="relative border-b border-l p-1"
                    >
                      <button
                        onClick={() => openModalForSlot(court.id, time)}
                        disabled={past}
                        className={cn(
                          "h-full w-full rounded-md flex items-center justify-center transition-colors",
                          past
                            ? "text-gray-200 cursor-not-allowed"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                        )}
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {/* --- LLAMADA AL MODAL DE ADMIN CORRECTO --- */}
      {complex && (
        <BookingFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBooking(null);
          }}
          onSubmit={handleBookingSubmit}
          courts={complex.courts}
          timeSlots={timeSlots}
          initialValues={
            editingBooking
              ? {
                  ...editingBooking,
                  time: `${String(editingBooking.startTime).padStart(
                    2,
                    "0"
                  )}:${String(editingBooking.startMinute || 0).padStart(
                    2,
                    "0"
                  )}`,
                }
              : modalInitialValues
          }
          isEditing={!!editingBooking}
        />
      )}
    </>
  );
}
