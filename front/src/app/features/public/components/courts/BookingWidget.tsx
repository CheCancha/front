"use client";

import React, { useState, useEffect } from "react";
import "react-day-picker/dist/style.css";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, isToday } from "date-fns";
import { cn } from "@/shared/lib/utils";
import type {
  ComplexProfileData,
  CourtWithPriceRules,
  ValidStartTime,
} from "@/app/(public)/canchas/[slug]/page";
import { Calendar, Tag, Clock } from "lucide-react";

interface BookingWidgetProps {
  club: ComplexProfileData;
  onSlotClick: (court: CourtWithPriceRules, time: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  club,
  onSlotClick,
  selectedDate,
  setSelectedDate,
}) => {
  const [selectedCourt, setSelectedCourt] =
    useState<CourtWithPriceRules | null>(club.courts[0] || null);
  const [validStartTimes, setValidStartTimes] = useState<ValidStartTime[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  const [temporarilyBookedSlot, setTemporarilyBookedSlot] = useState<string | null>(null);


  const isSelectedDateToday = isToday(selectedDate);
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const isPast = (time: string) => {
    if (!isSelectedDateToday) return false;
    const [slotHour, slotMinute] = time.split(":").map(Number);
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMinute < currentMinute) return true;
    return false;
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!club.slug || !selectedDate) return;
      setTemporarilyBookedSlot(null);
      setIsAvailabilityLoading(true);
      try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const response = await fetch(
          `/api/complexes/public/${club.slug}/availability?date=${dateString}`
        );
        if (!response.ok)
          throw new Error("No se pudo cargar la disponibilidad.");
        const data: ValidStartTime[] = await response.json();
        setValidStartTimes(data);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        setValidStartTimes([]);
      } finally {
        setIsAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [club.slug, selectedDate]);

  if (!selectedCourt) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center text-gray-500">
        Este complejo no tiene canchas configuradas.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
        Reservar un turno
      </h2>
      
      {/* --- SECCIÓN SUPERIOR: CALENDARIO Y CANCHAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
        
        {/* Columna del Calendario */}
        <div>
          <label className="text-sm font-semibold text-paragraph mb-2 flex items-center gap-2">
            <Calendar size={16} /> 1. Elegí el día
          </label>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="border rounded-md p-2 bg-white"
            locale={es}
            disabled={{ before: new Date() }}
          />
        </div>

        {/* Columna de Canchas */}
        <div>
          <label className="text-sm font-semibold text-paragraph mb-2 flex items-center gap-2">
            <Tag size={16} /> 2. Elegí la cancha
          </label>
          <div className="flex flex-col space-y-2">
            {club.courts.map((court: CourtWithPriceRules) => (
              <button
                key={court.id}
                onClick={() => setSelectedCourt(court)}
                className={cn(
                  "px-4 py-3 rounded-lg text-left font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange",
                  selectedCourt.id === court.id
                    ? "bg-brand-orange text-white border-brand-orange shadow-md"
                    : "bg-gray-50 text-foreground border-gray-200 hover:border-brand-orange hover:bg-orange-50 cursor-pointer"
                )}
              >
                {court.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN INFERIOR: HORARIOS --- */}
      <div className="border-t border-gray-200 pt-6">
        <label className="text-sm font-semibold text-paragraph mb-4 flex items-center gap-2">
          <Clock size={16} /> 3. Seleccioná un horario de inicio
        </label>
        {isAvailabilityLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            Cargando disponibilidad...
          </div>
        ) : validStartTimes.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {validStartTimes.map((slot) => {
              const courtStatus = slot.courts.find(
                (c) => c.courtId === selectedCourt.id
              );
              const isAvailable = courtStatus?.available ?? false;
              const past = isPast(slot.time);
              const isTemporarilyBooked = temporarilyBookedSlot === slot.time;

              return (
                <button
                  key={slot.time}
                  disabled={!isAvailable || past || isTemporarilyBooked}
                  onClick={() => {
                    if (selectedCourt) {
                      setTemporarilyBookedSlot(slot.time);
                      onSlotClick(selectedCourt, slot.time);
                    }
                  }}
                  className={cn(
                    "p-3 rounded-md text-center font-semibold transition-colors text-sm",
                    !isAvailable || past || isTemporarilyBooked
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-neutral-200 text-neutral-800 hover:bg-brand-orange hover:text-white cursor-pointer"
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-center text-gray-500 bg-gray-50 rounded-lg p-4">
            <p>No hay horarios disponibles para este día.</p>
          </div>
        )}
      </div>
    </div>
  );
};