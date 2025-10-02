"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, PlusCircle } from "lucide-react";
import { format, add, startOfDay, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import type {
  Complex,
  Court,
  Booking as PrismaBooking,
  Sport,
  BookingStatus,
  PriceRule,
} from "@prisma/client";
import { toast } from "react-hot-toast";
import BookingFormModal from "@/shared/components/ui/BookingFormModal";

// --- TIPOS ---
type CourtWithSportAndPriceRules = Court & {
  sport: Sport;
  priceRules: PriceRule[];
};

type ComplexWithCourts = Complex & { courts: CourtWithSportAndPriceRules[] };
type BookingWithDetails = PrismaBooking & {
  court: { id: string; name: string; slotDurationMinutes: number };
  user?: { name: string | null } | null;
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
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string>("Todos");
  const [isEditing, setIsEditing] = useState(false);
  const [modalData, setModalData] = useState<Partial<SubmitPayload & { id: string }>>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = useMemo(() => {
    if (!complex) return [];
    console.log("LOG (useMemo timeSlots): Calculando time slots porque 'complex' existe.");
    const slots = [];
    const open = complex.openHour ?? 9;
    const close = complex.closeHour ?? 23;
    const interval = complex.timeSlotInterval || 30;
    for (let h = open; h < close; h++) {
      for (let m = 0; m < 60; m += interval) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots;
  }, [complex]);

  const isPast = useCallback((time: string) => {
    const today = startOfDay(new Date());
    if (isBefore(currentDate, today)) return true;
    if (!isToday(currentDate)) return false;
    
    const [slotHour, slotMinute] = time.split(":").map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMinute < currentMinute) return true;
    return false;
  }, [currentDate]);

  const fetchBookingsForDate = useCallback(async (date: Date) => {
    if (!complexId) return;
    const dateString = format(date, "yyyy-MM-dd");
    console.log(`LOG (fetchBookingsForDate): Iniciando fetch de reservas para fecha: ${dateString}`);
    try {
      const res = await fetch(`/api/complex/${complexId}/bookings?date=${dateString}`);
      if (!res.ok) throw new Error("Error al cargar las reservas.");
      const data = await res.json();
      console.log("LOG (fetchBookingsForDate): Reservas recibidas:", data);
      setBookings(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado");
      console.error("LOG (fetchBookingsForDate): Error en el fetch:", error);
    }
  }, [complexId]);

  useEffect(() => {
    if (!complexId) return;
    const fetchComplexData = async () => {
      console.log("LOG (useEffect fetchComplexData): Iniciando fetch de datos del complejo.");
      setIsLoading(true);
      try {
        const res = await fetch(`/api/complex/${complexId}/settings`);
        if (!res.ok) throw new Error("Error al cargar datos del complejo.");
        
        const responseData = await res.json();
        console.log("LOG (useEffect fetchComplexData): Respuesta COMPLETA de la API recibida:", responseData);
        
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // La API devuelve { complex: {...} }, extraemos el objeto de adentro.
        const complexData = responseData.complex;

        if (!complexData) {
            console.error("LOG: El objeto 'complex' no se encontró dentro de la respuesta de la API.", responseData);
            throw new Error("El formato de la respuesta de la API es incorrecto.");
        }

        if (!Array.isArray(complexData.courts)) {
            console.error("LOG: Los datos recibidos del complejo no tienen un array de 'courts'.", complexData);
            throw new Error("Formato de datos del complejo incorrecto.");
        }
        
        console.log("LOG (useEffect fetchComplexData): Datos del complejo extraídos y validados. Guardando en el estado:", complexData);
        setComplex(complexData);

      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error inesperado");
        console.error("LOG (useEffect fetchComplexData): Error en el fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplexData();
  }, [complexId]);

  useEffect(() => {
    if (complex) {
      console.log("LOG (useEffect fetchBookings): 'complex' existe, llamando a fetchBookingsForDate.");
      fetchBookingsForDate(currentDate);
    } else {
      console.log("LOG (useEffect fetchBookings): 'complex' todavía es null, esperando...");
    }
  }, [complex, currentDate, fetchBookingsForDate]);

  const handleDateChange = (days: number) => {
    setCurrentDate((prev) => add(prev, { days }));
  };
  
  const handleGoToToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };

  const handleBookingSubmit = async (bookingData: SubmitPayload) => {
    setIsSubmitting(true);
    const endpoint = `/api/complex/${complexId}/bookings`;
    const method = isEditing ? "PATCH" : "POST";
    const successMessage = isEditing ? "Reserva actualizada" : "Reserva creada";
    const body = isEditing
      ? bookingData
      : { ...bookingData, date: format(currentDate, "yyyy-MM-dd") };

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
      toast.success(successMessage);
      setIsModalOpen(false);
      await fetchBookingsForDate(currentDate);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la reserva."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModalForSlot = (courtId: string, time: string) => {
    setIsEditing(false);
    setModalData({ courtId, time });
    setIsModalOpen(true);
  };

  const openModalForEdit = (booking: BookingWithDetails) => {
    setIsEditing(true);
    setModalData({
      ...booking,
      guestName: booking.guestName ?? "",
      time: `${String(booking.startTime).padStart(2, "0")}:${String(
        booking.startMinute || 0
      ).padStart(2, "0")}`,
      date: format(booking.date, "yyyy-MM-dd"),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalData(undefined);
      setIsEditing(false);
    }, 300);
  };

  const { filteredCourts, sportFilters } = useMemo(() => {
    console.log("LOG (useMemo filteredCourts): Recalculando canchas filtradas. 'complex' es:", complex);
    if (!complex || !complex.courts) {
      console.warn("LOG (useMemo filteredCourts): 'complex' o 'complex.courts' es nulo/indefinido. Devolviendo arrays vacíos.");
      return { filteredCourts: [], sportFilters: ["Todos"] };
    }
    
    console.log("LOG (useMemo filteredCourts): 'complex.courts' es un array, procediendo a mapear deportes.");
    const sports = ["Todos", ...new Set(complex.courts.map((c) => c.sport.name))];
    const courts = sportFilter === "Todos"
      ? complex.courts
      : complex.courts.filter((c) => c.sport.name === sportFilter);
    return { filteredCourts: courts, sportFilters: sports };
  }, [complex, sportFilter]);

  const bookingsByCourt = useMemo(() => {
    const map = new Map<string, BookingWithDetails[]>();
    bookings.forEach((booking) => {
      if (!map.has(booking.courtId)) {
        map.set(booking.courtId, []);
      }
      map.get(booking.courtId)!.push(booking);
    });
    return map;
  }, [bookings]);

  const statusColors: Record<BookingStatus, string> = {
    CONFIRMADO: "bg-green-100 text-green-800 border-l-4 border-green-500",
    PENDIENTE: "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500",
    COMPLETADO: "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
    CANCELADO: "bg-red-100 text-red-800 border-l-4 border-red-500 opacity-70",
  };

  if (isLoading || !complex) return <CalendarSkeleton />;

  return (
    <>
      <div className="flex-1 bg-gray-50 p-1">
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
              gridTemplateColumns: `minmax(70px, auto) repeat(${filteredCourts.length}, minmax(150px, 1fr))`,
              gridAutoRows: "2.5rem",
            }}
          >
            <div className="sticky top-0 left-0 bg-white z-20 flex items-center justify-center p-2 border-b border-r">
              <button
                onClick={() => {
                  if (filteredCourts.length > 0 && timeSlots.length > 0) {
                    openModalForSlot(filteredCourts[0].id, timeSlots[0]);
                  } else {
                    toast.error("No hay canchas o horarios disponibles para crear una reserva.");
                  }
                }}
                disabled={filteredCourts.length === 0}
                className="flex items-center justify-center w-full h-full text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-md cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                <div className="sticky left-0 text-right text-xs font-mono text-gray-500 pr-2 border-r flex items-center justify-end bg-white z-10">
                  {time}
                </div>
                {filteredCourts.map((court) => {
                  const courtBookings = bookingsByCourt.get(court.id) || [];
                  const slotStartMinutes =
                    parseInt(time.split(":")[0]) * 60 +
                    parseInt(time.split(":")[1]);

                  const bookingStartingNow = courtBookings.find(
                    (b) =>
                      b.startTime * 60 + (b.startMinute || 0) ===
                      slotStartMinutes
                  );

                  if (bookingStartingNow) {
                    const interval = complex.timeSlotInterval || 30;
                    const rowSpan = bookingStartingNow.court.slotDurationMinutes / interval;
                    return (
                      <div
                        key={`${court.id}-${time}`}
                        className="relative border-b border-l p-1"
                        style={{ gridRow: `span ${rowSpan}` }}
                      >
                        <button
                          onClick={() => openModalForEdit(bookingStartingNow)}
                          className={cn(
                            "rounded-md w-full h-full p-2 text-left text-xs font-semibold cursor-pointer flex flex-col justify-between",
                            statusColors[bookingStartingNow.status]
                          )}
                        >
                          <div>
                            <span className="font-bold block">
                              {bookingStartingNow.user?.name ||
                                bookingStartingNow.guestName ||
                                "Cliente"}
                            </span>
                            <span className="capitalize text-xs">
                              {bookingStartingNow.status.toLowerCase()}
                            </span>
                          </div>
                          <span className="font-bold text-sm self-end">
                            {bookingStartingNow.depositPaid.toLocaleString(
                              "es-AR",
                              { style: "currency", currency: "ARS" }
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  }

                  const isSlotCovered = courtBookings.some(
                    (b) =>
                      slotStartMinutes >
                        b.startTime * 60 + (b.startMinute || 0) &&
                      slotStartMinutes <
                        b.startTime * 60 +
                          (b.startMinute || 0) +
                          b.court.slotDurationMinutes
                  );

                  if (isSlotCovered) {
                    return null;
                  }

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
      {complex && (
        <BookingFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleBookingSubmit}
          courts={complex.courts}
          timeSlots={timeSlots}
          initialValues={modalData}
          isEditing={isEditing}
          existingBookings={bookings}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
