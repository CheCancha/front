"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { PlusCircle, Phone, Lock } from "lucide-react";
import { formatHour } from "@/shared/helper/formatHour";
import {
  ComplexWithCourts,
  CalendarEvent,
  BookingEvent,
} from "@/shared/entities/complex/types";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

const statusColors: Record<string, string> = {
  CONFIRMADO: "bg-green-100 text-green-800 border-l-4 border-green-500",
  PENDIENTE: "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500",
  COMPLETADO: "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
  CANCELADO: "bg-red-100 text-red-800 border-l-4 border-red-500 opacity-70",
  BLOQUEADO: "bg-gray-200 text-gray-700",
  ABONO: "bg-lime-100 text-brand-dark",
  ENTRENAMIENTO: "bg-purple-100 text-purple-800",
};

interface BookingCalendarViewProps {
  view: "day" | "week";
  complex: ComplexWithCourts;
  filteredCourts: ComplexWithCourts["courts"];
  timeSlots: string[];
  eventsByCourt: Map<string, CalendarEvent[]>;
  isPast: (time: string) => boolean;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (courtId: string, time: string) => void;
  onWeekSlotClick: (courtId: string, time: string, date: Date) => void; // <--- AÑADIR
  onOpenNewBookingSheet: (time?: string, date?: Date) => void;
  weekDays: Date[];
}

function isBookingEvent(event: CalendarEvent): event is BookingEvent {
  return event.type === "BOOKING" || event.type === "FIXED_SLOT";
}

export const BookingCalendarView: React.FC<BookingCalendarViewProps> = ({
  view,
  complex,
  filteredCourts,
  timeSlots,
  eventsByCourt,
  isPast,
  onOpenNewBookingSheet,
  onEventClick,
  onSlotClick,
  onWeekSlotClick,
  weekDays,
}) => {
  const allEvents = React.useMemo(
    () => Array.from(eventsByCourt.values()).flat(),
    [eventsByCourt]
  );

  if (view === "day") {
    // --- VISTA DIARIA ---
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `minmax(80px, auto) repeat(${filteredCourts.length}, minmax(120px, 1fr))`,
          gridAutoRows: "5.2rem",
        }}
      >
        {/* Header (Botón + Nombres de Canchas) */}
        <div className="sticky top-0 left-0 bg-white z-20 flex items-center justify-center p-2 border-b border-r">
          <button
            onClick={() => {
              console.log("Clic en Botón + (Hijo)");
              onOpenNewBookingSheet();
            }}
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

        {/* Grilla de Horarios */}
        {timeSlots.map((time) => (
          <React.Fragment key={time}>
            <div className="sticky left-0 text-right text-sm font-mono text-paragraph pr-2 border-r flex items-center justify-end bg-white z-10">
              {formatHour(time)}
            </div>
            {filteredCourts.map((court) => {
              const courtEvents = eventsByCourt.get(court.id) || [];
              const slotStartMinutes =
                parseInt(time.split(":")[0]) * 60 +
                parseInt(time.split(":")[1]);

              // 1. Renderizar Evento si existe
              const eventStartingNow = courtEvents.find((e) => {
                const eventStart = e.startTime * 60 + (e.startMinute || 0);
                return slotStartMinutes === eventStart;
              });

              if (eventStartingNow) {
                const interval = complex.timeSlotInterval || 30;
                let rowSpan = 2; // Default

                if (eventStartingNow.type === "BOOKING") {
                  rowSpan =
                    eventStartingNow.court.slotDurationMinutes / interval;
                } else if (
                  (eventStartingNow.type === "BLOCKED_SLOT" ||
                    eventStartingNow.type === "FIXED_SLOT") &&
                  eventStartingNow.endTime
                ) {
                  const [endH, endM] = eventStartingNow.endTime
                    .split(":")
                    .map(Number);
                  const endMinutes = endH * 60 + endM;
                  rowSpan = (endMinutes - slotStartMinutes) / interval;
                  if (rowSpan <= 0) rowSpan = 2; // Fallback
                }

                return (
                  <div
                    key={`${court.id}-${time}`}
                    className="relative border-b border-l p-1"
                    style={{ gridRow: `span ${rowSpan}` }}
                  >
                    <button
                      onClick={() => onEventClick(eventStartingNow)}
                      className={cn(
                        "rounded-md w-full h-full p-2 text-left text-xs font-semibold cursor-pointer flex flex-col justify-between",
                        statusColors[eventStartingNow.status]
                      )}
                    >
                      {/* Contenido del Evento */}
                      <div>
                        <span className="font-bold block text-sm">
                          {eventStartingNow.user?.name ||
                            (isBookingEvent(eventStartingNow)
                              ? eventStartingNow.guestName
                              : null) ||
                            "Cliente"}
                        </span>
                        {eventStartingNow.type === "BOOKING" ? (
                          (eventStartingNow.user?.phone ||
                            eventStartingNow.guestPhone) && (
                            <span className="flex items-center gap-1 font-normal opacity-90 mt-0.5">
                              <Phone size={12} className="shrink-0" />
                              {eventStartingNow.user?.phone ||
                                eventStartingNow.guestPhone}
                            </span>
                          )
                        ) : eventStartingNow.type === "BLOCKED_SLOT" ? (
                          <span className="flex items-center gap-1 font-normal opacity-90 mt-0.5">
                            <Lock size={12} className="shrink-0" />
                            Bloqueado
                          </span>
                        ) : null}

                        <div className="flex justify-between items-center">
                          <span className="capitalize text-xs">
                            {eventStartingNow.status.toLowerCase()}
                          </span>
                          <span className="font-bold text-sm self-end">
                            {eventStartingNow.type === "BOOKING" &&
                              (
                                (eventStartingNow.depositPaid ?? 0) / 100
                              ).toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              }

              // 2. Renderizar Slot Cubierto (si no empieza ahora pero está ocupado)
              const isSlotCovered = courtEvents.some((e) => {
                const eventStart = e.startTime * 60 + (e.startMinute || 0);
                let eventEnd;
                if (e.type === "BOOKING") {
                  eventEnd = eventStart + e.court.slotDurationMinutes;
                } else if (e.endTime) {
                  const [endH, endM] = e.endTime.split(":").map(Number);
                  eventEnd = endH * 60 + endM;
                } else {
                  eventEnd = eventStart + (complex.timeSlotInterval || 30);
                }
                return (
                  slotStartMinutes >= eventStart && slotStartMinutes < eventEnd
                );
              });

              if (isSlotCovered) return null;

              // 3. Renderizar Slot Vacío
              const past = isPast(time);
              const slotHour = parseInt(time.split(":")[0]);

              const hasPriceRule = court.priceRules.some(
                (rule) => slotHour >= rule.startTime && slotHour < rule.endTime
              );

              const isEnabled = !past && !isSlotCovered && hasPriceRule;

              return (
                <div
                  key={`${court.id}-${time}`}
                  className="relative border-b border-l p-1"
                >
                  <button
                    onClick={() => isEnabled && onSlotClick(court.id, time)}
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
                      className={cn(
                        "transition-opacity",
                        isEnabled ? "group-hover:opacity-0" : "opacity-50"
                      )}
                    />
                    {isEnabled && (
                      <span className="absolute text-sm font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatHour(time)}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  }

  
  // --- VISTA SEMANAL (ACTUALIZADA) ---
 if (view === "week") {
    return (
      <div className="border-t">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `minmax(80px, auto) repeat(7, minmax(150px, 1fr))`,
          }}
        >
          {/* Header: Esquina vacía + Días de la semana */}
          <div className="sticky top-0 left-0 bg-white z-20 flex items-center justify-center p-2 border-b border-r">
            <button
              onClick={() => onOpenNewBookingSheet()} 
              disabled={filteredCourts.length === 0}
              className="flex items-center justify-center w-full h-full text-sm font-semibold text-white bg-black hover:bg-brand-dark rounded-md cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Añadir nueva reserva"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="sticky top-0 text-center font-semibold p-2 border-b border-l border-b-brand-dark/30 bg-white z-10"
            >
              <p className="capitalize text-xs text-gray-500">
                {format(day, "eee", { locale: es })}
              </p>
              <p className="text-2xl">{format(day, "d")}</p>
            </div>
          ))}

          {/* Contenido: Horas + Celdas de eventos/slots */}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              {/* Columna de Hora */}
              <div className="sticky left-0 text-right text-xs font-mono text-gray-500 pr-2 border-r flex items-center justify-end bg-white z-10 min-h-[6rem]">
                {formatHour(time)}
              </div>

              {/* Celdas de (Día x Hora) */}
              {weekDays.map((day) => {
                const cellKey = `${day.toISOString()}-${time}`;

                return (
                  <div
                    key={cellKey}
                    className="relative border-b border-l border-brand-dark/30 min-h-[6rem] flex flex-col"
                  >
                    {filteredCourts.map((court, index, arr) => {
                      
                      // 1. Encontrar evento (si existe)
                      const eventForThisSlot = allEvents.find(
                        (e) =>
                          e.court.id === court.id && 
                          isSameDay(new Date(e.date), day) && 
                          `${String(e.startTime).padStart(2, "0")}:${String(
                            e.startMinute ?? 0
                          ).padStart(2, "0")}` === time 
                      );

                      // 2. Determinar si el slot vacío está habilitado
                      const now = new Date();
                      const slotDateTime = new Date(day);
                      const [hour, minute] = time.split(":").map(Number);
                      slotDateTime.setHours(hour, minute, 59, 999);
                      const past = slotDateTime < now;
                      const slotHour = parseInt(time.split(":")[0]);
                      const hasPriceRule = court.priceRules.some(
                        (rule) =>
                          slotHour >= rule.startTime && slotHour < rule.endTime
                      );
                      const isEnabled = !past && hasPriceRule;

                      // Separador (no añadir después del último)
                      const separator =
                        index < arr.length - 1
                          ? "border-b border-gray-200"
                          : "";

                      if (eventForThisSlot) {
                        // --- A. HAY EVENTO: Renderizar evento ---
                        return (
                          <button
                            key={eventForThisSlot.id}
                            onClick={() => onEventClick(eventForThisSlot)}
                            // CLAVE: flex-1 divide el espacio vertical
                            className={cn(
                              "flex-1 p-1.5 rounded-none text-xs w-full text-left overflow-hidden cursor-pointer",
                              statusColors[eventForThisSlot.status],
                              separator
                            )}
                          >
                            <p className="font-bold truncate">
                              {eventForThisSlot.user?.name ||
                                (isBookingEvent(eventForThisSlot)
                                  ? eventForThisSlot.guestName
                                  : null) ||
                                "Cliente"}
                            </p>
                            <p className="truncate opacity-70">
                              {eventForThisSlot.court.name}
                            </p>
                          </button>
                        );
                      } else {
                        return (
                          <button
                            key={court.id}
                            onClick={() =>
                              isEnabled &&
                              onWeekSlotClick(court.id, time, day)
                            }
                            disabled={!isEnabled}
                            className={cn(
                              "flex-1 min-h-[2rem] rounded-none flex items-center justify-center transition-colors",
                              isEnabled
                                ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer group"
                                : "bg-gray-50 text-gray-300 cursor-not-allowed",
                              separator
                            )}
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlusCircle size={14} className="inline mr-1" />
                              {court.name}
                            </span>
                          </button>
                        );
                      }
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return null;
};