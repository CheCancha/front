"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import {
  format,
  add,
  startOfDay,
  isBefore,
  isToday,
  startOfWeek,
  endOfWeek,
  getDay,
} from "date-fns";
import type { Schedule, BookingStatus, PaymentMethod } from "@prisma/client";

import { toast } from "react-hot-toast";
import BookingSheet from "@/app/features/dashboard/components/booking/BookingSheet";
import { AbonoManagmentPanel } from "@/app/features/dashboard/components/booking/AbonoManagmentPanel";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../shared/components/ui/tabs";
import {
  ComplexWithCourts,
  CalendarEvent,
  BookingWithDetails,
} from "@/shared/entities/complex/types";
import { CalendarToolbar } from "@/app/features/dashboard/components/booking/CalendarToolbar";
import { BookingCalendarView } from "@/app/features/dashboard/components/booking/BookingCalendarView";

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

const parseHour = (hourString: string | null | undefined): number | null => {
  if (typeof hourString !== "string") return null;
  try {
    return parseInt(hourString.split(":")[0], 10);
  } catch {
    return null;
  }
};

// --- PÁGINA PRINCIPAL "CEREBRO" ---
export default function BookingCalendarPage() {
  const params = useParams();
  const complexId = params.complexId as string;

  // --- ESTADO PRINCIPAL ---
  const [complex, setComplex] = useState<ComplexWithCourts | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>("Todos");
  const [isRefreshing, startRefresh] = useTransition();
  const [view, setView] = useState<"day" | "week">("day");
  const [activeTab, setActiveTab] = useState("calendar");

  // --- ESTADO DE MODALES ---
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

  // --- HOOKS useMemo (Lógica de datos) ---
  const realBookings = useMemo(() => {
    return events.filter(
      (event): event is BookingWithDetails & { type: "BOOKING" } =>
        event.type === "BOOKING"
    );
  }, [events]);

  const { dayOpenHour, dayCloseHour } = useMemo(() => {
    if (!complex?.schedule) {
      return { dayOpenHour: 9, dayCloseHour: 23 };
    }
    const dayIndex = getDay(currentDate);
    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayKey = dayKeys[dayIndex];
    const openKey = `${dayKey}Open` as keyof Schedule;
    const closeKey = `${dayKey}Close` as keyof Schedule;
    const openString = complex.schedule[openKey];
    const closeString = complex.schedule[closeKey];
    const open = parseHour(openString) ?? 9;
    const close = parseHour(closeString) ?? 23;
    return { dayOpenHour: open, dayCloseHour: close };
  }, [complex, currentDate]);

  const timeSlots = useMemo(() => {
    if (!complex) return [];
    const slots = [];
    const open = dayOpenHour;
    const close = dayCloseHour;
    const interval = complex.timeSlotInterval || 30;

    let currentMinutes = open * 60;
    const endMinutes = close * 60;

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      slots.push(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      );
      currentMinutes += interval;
    }
    return slots;
  }, [complex, dayOpenHour, dayCloseHour]);

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

  const eventsByCourt = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      if (!map.has(event.court.id)) {
        map.set(event.court.id, []);
      }
      map.get(event.court.id)!.push(event);
    });
    return map;
  }, [events]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }).map((_, i) => add(start, { days: i }));
  }, [currentDate]);

  // --- HANDLERS de Carga de Datos ---
  const fetchBookingsForDate = useCallback(
    async (date: Date, currentView: "day" | "week") => {
      if (!complexId) return;
      startRefresh(async () => {
        let url = `/api/complex/${complexId}/bookings?`;
        if (currentView === "day") {
          url += `date=${format(date, "yyyy-MM-dd")}`;
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
          setEvents(data);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Error inesperado"
          );
        }
      });
    },
    [complexId, startRefresh]
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

  useEffect(() => {
    console.log(
      "%cCAMBIO DE ESTADO: isModalOpen ahora es:",
      "font-weight: bold;",
      isModalOpen
    );
  }, [isModalOpen]);

  // --- HANDLERS de Interacción ---
  const handleRefresh = useCallback(() => {
    toast.success("Actualizando calendario...");
    fetchBookingsForDate(currentDate, view);
  }, [currentDate, view, fetchBookingsForDate]);

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
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ocurrió un error.");
      }
      toast.success(successMessage);
      closeModal();
      handleRefresh();
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

  const handleDateChange = (days: number) =>
    setCurrentDate((prev) => add(prev, { days }));
  const handleGoToToday = () => setCurrentDate(startOfDay(new Date()));

  const executeStatusUpdate = async (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO",
    loadingToastId?: string,
    finalPaymentAmount?: number
  ) => {
    console.log(
      `[LOG-EXECUTE] Iniciando. BookingID: ${bookingId}, Status: ${status}, PagoFinal: ${finalPaymentAmount}`
    );

    try {
      const body: {
        bookingId: string;
        status: "COMPLETADO" | "CANCELADO";
        depositPaid?: number; // Re-habilitamos este campo
      } = { bookingId, status };

      if (
        status === "COMPLETADO" &&
        finalPaymentAmount &&
        finalPaymentAmount > 0
      ) {
        body.depositPaid = finalPaymentAmount;
        console.log("[LOG-EXECUTE] Añadiendo pago final al body:", body);
      }

      console.log(
        "[LOG-EXECUTE] Llamando a API PATCH /api/complex/.../bookings"
      );
      const response = await fetch(`/api/complex/${complexId}/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(
          "[LOG-EXECUTE] ERROR: La API devolvió un error.",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("[LOG-EXECUTE] Detalle del error:", errorText);
        throw new Error("No se pudo actualizar la reserva.");
      }

      console.log("[LOG-EXECUTE] API PATCH exitosa.");
      toast.success("Reserva actualizada.");
      closeModal();
      await fetchBookingsForDate(currentDate, view);
      console.log("[LOG-EXECUTE] Modal cerrado y calendario refrescado.");
    } catch (error) {
      console.error("[LOG-EXECUTE] Error en el bloque CATCH:", error);
      toast.error(
        error instanceof Error ? error.message : "Error desconocido."
      );
    } finally {
      console.log("[LOG-EXECUTE] Bloque FINALLY ejecutado.");
      if (loadingToastId) {
        console.log(`[LOG-EXECUTE] Cerrando toast ID: ${loadingToastId}`);
        toast.dismiss(loadingToastId);
      }
    }
  };

  const handleUpdateBookingStatus = (
    bookingId: string,
    status: "COMPLETADO" | "CANCELADO",
    loadingToastId?: string,
    finalPaymentAmount?: number
  ) => {
    if (status === "CANCELADO") {
      setActionToConfirm({ bookingId, status });
    } else {
      executeStatusUpdate(
        bookingId,
        status,
        loadingToastId,
        finalPaymentAmount
      );
    }
  };

  const handleSlotClick = (courtId: string, time: string) => {
    setModalSlot({ courtId, time });
    setModalBooking(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === "BOOKING" || event.type === "FIXED_SLOT") {
      setModalBooking(event as BookingWithDetails);
      setModalSlot(null);
      setIsModalOpen(true);
    } else if (event.type === "BLOCKED_SLOT") {
      toast.success(event.user.name || "Horario bloqueado");
    }
  };

  const handleWeekSlotClick = (courtId: string, time: string, date: Date) => {
    console.log(
      `[page.tsx] Clic en grilla semanal: ${courtId}, ${time}, ${date}`
    );

    // 1. Actualizamos la fecha principal a la del día seleccionado
    setCurrentDate(startOfDay(date));

    // 2. Pre-cargamos el slot (ahora SÍ tenemos courtId y time)
    setModalSlot({ courtId, time });
    setModalBooking(null);
    setIsModalOpen(true);
  };

  const handleOpenNewBookingSheet = (time?: string, date?: Date) => {
    if (date) {
      setCurrentDate(startOfDay(date));
    }
    setModalSlot(time ? { courtId: "", time: time } : null);
    setModalBooking(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalBooking(null);
      setModalSlot(null);
    }, 300);
  };

  if (isLoading || !complex) return <CalendarSkeleton />;

  return (
    <>
      {/* --- ESTRUCTURA DE TABS --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="abonos">
            <Users className="mr-2 h-4 w-4" />
            Gestión de Turnos Fijos
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: CALENDARIO --- */}
        <TabsContent value="calendar" className="space-y-6">
          <CalendarToolbar
            currentDate={currentDate}
            view={view}
            sportFilter={sportFilter}
            sportFilters={sportFilters}
            isRefreshing={isRefreshing}
            onDateChange={handleDateChange}
            onSelectDate={(date) => date && setCurrentDate(date)}
            onGoToToday={handleGoToToday}
            onViewChange={setView}
            onFilterChange={setSportFilter}
            onRefresh={handleRefresh}
          />

          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <BookingCalendarView
              view={view}
              complex={complex}
              filteredCourts={filteredCourts}
              timeSlots={timeSlots}
              eventsByCourt={eventsByCourt}
              isPast={isPast}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onWeekSlotClick={handleWeekSlotClick}
              onOpenNewBookingSheet={handleOpenNewBookingSheet}
              weekDays={weekDays}
            />
          </div>
        </TabsContent>

        {/* --- TAB 2: GESTIÓN DE ABONOS --- */}
        <TabsContent value="abonos" className="space-y-6">
          <AbonoManagmentPanel
            complexId={complexId}
            courts={complex.courts}
            onAbonosUpdated={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {/* --- Diálogo de Confirmación para CANCELAR RESERVA --- */}
      <AlertDialog
        open={!!actionToConfirm}
        onOpenChange={(open) => !open && setActionToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de que querés cancelar esta reserva?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la reserva como cancelada y no se puede
              deshacer.
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

      {complex && (
        <BookingSheet
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleBookingSubmit}
          onUpdateStatus={handleUpdateBookingStatus}
          courts={complex.courts}
          timeSlots={timeSlots}
          initialBooking={modalBooking}
          initialSlot={modalSlot}
          // courts={filteredCourts} // <--- PASAR LAS CANCHAS
          // timeSlots={timeSlots}
          existingBookings={realBookings}
          isSubmitting={isSubmitting}
          onPlayerRemoved={() => {}}
          currentDate={currentDate}
          onBookingUpdate={handleRefresh}
        />
      )}
    </>
  );
}
