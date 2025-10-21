"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  PlusCircle,
  Phone,
} from "lucide-react";
import {
  format,
  add,
  startOfDay,
  isBefore,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import type {
  Complex,
  Court,
  Sport,
  BookingStatus,
  PriceRule,
} from "@prisma/client";
import { toast } from "react-hot-toast";
import BookingFormModal, {
  type BookingWithDetails,
  type SubmitPayload,
} from "@/shared/components/ui/BookingFormModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

// --- TIPOS ---
type CourtWithSportAndPriceRules = Court & {
  sport: Sport;
  priceRules: PriceRule[];
};
type ComplexWithCourts = Complex & { courts: CourtWithSportAndPriceRules[] };

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
  const [sportFilter, setSportFilter] = useState<string>("Todos");

  const [view, setView] = useState<"day" | "week">("day");
  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const weekStartsOn = 1;
    const start = startOfWeek(currentDate, { weekStartsOn });
    const end = endOfWeek(currentDate, { weekStartsOn });
    const days = eachDayOfInterval({ start, end });
    return { weekStart: start, weekEnd: end, weekDays: days };
  }, [currentDate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBooking, setModalBooking] = useState<BookingWithDetails | null>(
    null
  );
  const [modalSlot, setModalSlot] = useState<{
    courtId: string;
    time: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{
    bookingId: string;
    status: "CANCELADO";
  } | null>(null);

  const timeSlots = useMemo(() => {
    if (!complex) return [];
    const slots = [];
    const open = complex.openHour ?? 9;
    const close = complex.closeHour ?? 23;
    const interval = complex.timeSlotInterval || 30;
    for (let h = open; h < close; h++) {
      for (let m = 0; m < 60; m += interval) {
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }
    return slots;
  }, [complex]);

  const isPast = (time: string) => {
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
  };

  const fetchBookingsForDate = useCallback(
    async (date: Date, currentView: "day" | "week") => {
      if (!complexId) return;

      let url = `/api/complex/${complexId}/bookings?`;

      if (currentView === "day") {
        const dateString = format(date, "yyyy-MM-dd");
        url += `date=${dateString}`;
      } else {
        const weekStartsOn = 1;
        const startDate = startOfWeek(date, { weekStartsOn });
        const endDate = endOfWeek(date, { weekStartsOn });
        url += `startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(
          endDate,
          "yyyy-MM-dd"
        )}`;
      }

      try {
        const res = await fetch(url);
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
        const responseData = await res.json();
        const complexData = responseData.complex;
        if (!complexData || !Array.isArray(complexData.courts)) {
          throw new Error("Formato de datos del complejo incorrecto.");
        }
        setComplex(complexData);
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
      fetchBookingsForDate(currentDate, view);
    }
  }, [complex, currentDate, view, fetchBookingsForDate]);

  const handleDateChange = (days: number) =>
    setCurrentDate((prev) => add(prev, { days }));
  const handleGoToToday = () => setCurrentDate(startOfDay(new Date()));

  const handleBookingSubmit = async (bookingData: SubmitPayload) => {
    setIsSubmitting(true);
    const isEditing = !!bookingData.bookingId;
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
        try {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Ocurrió un error en el servidor."
          );
        } catch (parseError) {
          throw new Error("No se pudo procesar la respuesta del servidor.");
        }
      }

      toast.success(successMessage);
      closeModal();
      await fetchBookingsForDate(currentDate, view);  // le agregue yo view
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

  const executeStatusUpdate = async (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO"
  ) => {
    toast.loading("Actualizando reserva...");
    try {
      const body: {
        bookingId: string;
        status: "COMPLETADO" | "CANCELADO";
        depositPaid?: number;
      } = { bookingId, status };

      if (status === "COMPLETADO") {
        const bookingToComplete = bookings.find((b) => b.id === bookingId);
        if (bookingToComplete) {
          body.depositPaid = bookingToComplete.totalPrice;
        }
      }

      const response = await fetch(`/api/complex/${complexId}/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("No se pudo actualizar la reserva.");
      toast.dismiss();
      toast.success("Reserva actualizada.");
      closeModal();
      await fetchBookingsForDate(currentDate, view); // le agregue yo view
    } catch (error) {
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : "Error desconocido."
      );
    }
  };

  const handleUpdateBookingStatus = (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO"
  ) => {
    if (status === "CANCELADO") {
      setActionToConfirm({ bookingId, status });
    } else {
      executeStatusUpdate(bookingId, status);
    }
  };

  const handleOpenNewBookingModal = () => {
    setModalBooking(null);
    setModalSlot(null);
    setIsModalOpen(true);
  };

  const openModalForNew = (courtId: string, time: string) => {
    setModalSlot({ courtId, time });
    setModalBooking(null);
    setIsModalOpen(true);
  };

  const openModalForExisting = (booking: BookingWithDetails) => {
    setModalBooking(booking);
    setModalSlot(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalBooking(null);
      setModalSlot(null);
    }, 300);
  };

  const { filteredCourts, sportFilters } = useMemo(() => {
    if (!complex || !complex.courts) {
      return { filteredCourts: [], sportFilters: ["Todos"] };
    }
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
    <div className="flex-1 bg-gray-50 md:p-4">
      <header className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* --- GRUPO IZQUIERDO: CONTROLES DE NAVEGACIÓN --- */}
        <div className="flex items-center gap-4 self-start sm:self-center">
          {/* Navegación de Fecha */}
          <div className="flex items-center p-1 bg-white border rounded-lg shadow-sm">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-1.5 text-gray-500 hover:text-black"
              aria-label={view === 'day' ? "Día anterior" : "Semana anterior"}
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
              aria-label={view === 'day' ? "Día siguiente" : "Semana siguiente"}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Selector de Vista */}
          <div className="flex items-center p-1 bg-white border rounded-lg shadow-sm">
            <button
              onClick={() => setView("day")}
              className={cn(
                "px-3 py-1.5 text-sm font-semibold rounded-md transition-colors",
                view === "day"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1.5 text-sm font-semibold rounded-md transition-colors",
                view === "week"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Semana
            </button>
          </div>
        </div>

        {/* --- GRUPO DERECHO: INFO Y FILTROS --- */}
        <div className="flex items-center gap-4 self-start sm:self-center">
          <span className="font-semibold text-lg text-brand-dark capitalize text-right">
            {view === "day"
              ? format(currentDate, "eeee, dd MMMM", { locale: es })
              : `${format(weekStart, "dd MMM", { locale: es })} - ${format(
                  weekEnd,
                  "dd MMM",
                  { locale: es }
                )}`}
          </span>
          {/* El filtro de deportes solo se muestra en la vista diaria */}
          {view === "day" && (
            <div className="flex items-center gap-2 overflow-x-auto">
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
          )}
        </div>
      </header>
      
      {/* --- CONTENEDOR DEL CALENDARIO --- */}
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        {view === 'day' ? (
          // --- VISTA DIARIA (Tu código existente) ---
          <div
            className="grid"
            style={{
              gridTemplateColumns: `minmax(80px, auto) repeat(${filteredCourts.length}, minmax(120px, 1fr))`,
              gridAutoRows: "4.5rem",
            }}
          >
            <div className="sticky top-0 left-0 bg-white z-20 flex items-center justify-center p-2 border-b border-r">
              <button
                onClick={handleOpenNewBookingModal}
                disabled={filteredCourts.length === 0}
                className="flex items-center justify-center w-full h-full text-sm font-semibold text-white bg-black hover:bg-brand-dark rounded-md cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Añadir nueva reserva"
              >
                <PlusCircle size={16} />
              </button>
            </div>
            {filteredCourts.map((court) => (
              <div
                key={court.id}
                className="sticky top-0 text-center font-switzer font-semibold p-3 border-b border-l bg-white z-10 flex items-center justify-center"
              >
                {court.name}
              </div>
            ))}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="sticky left-0 text-right text-sm font-mono text-paragraph pr-2 border-r flex items-center justify-end bg-white z-10">
                  {time}
                </div>
                {filteredCourts.map((court) => {
                   const courtBookings = bookingsByCourt.get(court.id) || [];
                   const slotStartMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
                   const bookingStartingNow = courtBookings.find((b) => {
                     const bookingStart = b.startTime * 60 + (b.startMinute || 0);
                     return slotStartMinutes === bookingStart;
                   });
 
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
                           onClick={() => openModalForExisting(bookingStartingNow)}
                           className={cn(
                             "rounded-md w-full h-full p-2 text-left text-xs font-semibold cursor-pointer flex flex-col justify-between",
                             statusColors[bookingStartingNow.status]
                           )}
                         >
                           <div>
                             <span className="font-bold block">
                               {bookingStartingNow.user?.name || bookingStartingNow.guestName || "Cliente"}
                             </span>
                             {(bookingStartingNow.user?.phone || bookingStartingNow.guestPhone) && (
                                <span className="flex items-center gap-1 font-normal opacity-90 mt-0.5">
                                  <Phone size={12} className="shrink-0" />
                                  {bookingStartingNow.user?.phone || bookingStartingNow.guestPhone}
                                </span>
                              )}
                             <span className="capitalize text-xs">
                               {bookingStartingNow.status.toLowerCase()}
                             </span>
                           </div>
                           <span className="font-bold text-sm self-end">
                              {bookingStartingNow.depositPaid.toLocaleString("es-AR", { 
                                style: "currency", 
                                currency: "ARS",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                           </span>
                         </button>
                       </div>
                     );
                   }
 
                   const isSlotCovered = courtBookings.some((b) => {
                     const bookingStart = b.startTime * 60 + (b.startMinute || 0);
                     const bookingEnd = bookingStart + b.court.slotDurationMinutes;
                     return (
                       slotStartMinutes >= bookingStart &&
                       slotStartMinutes < bookingEnd
                     );
                   });
 
                   if (isSlotCovered) return null;
 
                   const past = isPast(time);
                   const isEnabled = !past && !isSlotCovered;
 
                   return (
                     <div
                       key={`${court.id}-${time}`}
                       className="relative border-b border-l p-1"
                     >
                       <button
                         onClick={() => isEnabled && openModalForNew(court.id, time)}
                         disabled={!isEnabled}
                         className={cn(
                           "h-full w-full rounded-md flex items-center justify-center transition-colors",
                           isEnabled
                             ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer group"
                             : "bg-gray-50 text-gray-300 cursor-not-allowed"
                         )}
                       >
                         <PlusCircle
                           size={18}
                           className={cn("transition-opacity", isEnabled ? "group-hover:opacity-0" : "opacity-50")}
                         />
                         {isEnabled && (
                           <span className="absolute text-sm font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                             {time}
                           </span>
                         )}
                       </button>
                     </div>
                   );
                })}
              </React.Fragment>
            ))}
          </div>
        ) : (
          // --- VISTA SEMANAL ---
          <div 
            className="grid" 
            style={{
              gridTemplateColumns: `minmax(80px, auto) repeat(7, minmax(150px, 1fr))`,
            }}
          >
            {/* Header: Esquina vacía + Días de la semana */}
            <div className="sticky top-0 left-0 bg-white z-20 border-b border-r"></div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="sticky top-0 text-center font-semibold p-2 border-b border-l bg-white z-10">
                <p className="capitalize text-xs text-gray-500">{format(day, "eee", { locale: es })}</p>
                <p className="text-2xl">{format(day, "d")}</p>
              </div>
            ))}

            {/* Contenido: Horas + Celdas de reservas */}
            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="sticky left-0 text-right text-xs font-mono text-gray-500 pr-2 border-r flex items-center justify-end bg-white z-10 h-24">{time}</div>
                {weekDays.map(day => {
                  const bookingsForSlot = bookings.filter(b => 
                    isSameDay(new Date(b.date), day) &&
                    `${String(b.startTime).padStart(2, "0")}:${String(b.startMinute ?? 0).padStart(2, "0")}` === time
                  );
                  return (
                    <div key={day.toISOString()} className="relative border-b border-l p-1 min-h-[6rem] flex flex-col gap-1">
                      {bookingsForSlot.map(booking => (
                        <button 
                          key={booking.id}
                          onClick={() => openModalForExisting(booking)}
                          className={cn(
                            "p-1.5 rounded text-xs w-full text-left overflow-hidden cursor-pointer",
                            statusColors[booking.status]
                          )}
                        >
                          <p className="font-bold truncate">{booking.user?.name || booking.guestName}</p>
                          <p className="truncate text-gray-600">{booking.court.name}</p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>

      {complex && (
        <BookingFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleBookingSubmit}
          onUpdateStatus={handleUpdateBookingStatus}
          courts={complex.courts}
          timeSlots={timeSlots}
          initialBooking={modalBooking}
          initialSlot={modalSlot}
          existingBookings={bookings}
          isSubmitting={isSubmitting}
          currentDate={currentDate}
        />
      )}

      <AlertDialog
        open={!!actionToConfirm}
        onOpenChange={(open) => !open && setActionToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de que querés cancelar?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la reserva como cancelada y no se puede
              deshacer. No se realizará ningún reembolso automático de la seña.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (actionToConfirm) {
                  await executeStatusUpdate(
                    actionToConfirm.bookingId,
                    actionToConfirm.status
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
</>
)}