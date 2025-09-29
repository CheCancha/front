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
} from "@/app/(public)/courts/[slug]/page";

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
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Reservar un turno
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-semibold text-paragraph mb-2 block">
            1. Elegí el día
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
        <div>
          <label className="text-sm font-semibold text-paragraph mb-2 block">
            2. Elegí la cancha
          </label>
          <div className="flex flex-wrap gap-2">
            {club.courts.map((court: CourtWithPriceRules) => (
              <button
                key={court.id}
                onClick={() => setSelectedCourt(court)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors",
                  selectedCourt.id === court.id
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "bg-transparent text-foreground border-gray-300 hover:border-brand-orange"
                )}
              >
                {court.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-paragraph mb-2 block">
          3. Seleccioná un horario de inicio
        </label>
        {isAvailabilityLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-500">
            Cargando disponibilidad...
          </div>
        ) : validStartTimes.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {validStartTimes.map((slot) => {
              const courtStatus = slot.courts.find(
                (c) => c.courtId === selectedCourt.id
              );
              const isAvailable = courtStatus?.available ?? false;
              const past = isPast(slot.time);

              return (
                <button
                  key={slot.time}
                  disabled={!isAvailable || past}
                  onClick={() => {
                    if (selectedCourt) {
                      onSlotClick(selectedCourt, slot.time);
                    }
                  }}
                  className={cn(
                    "p-2 rounded-md text-center font-semibold transition-colors",
                    !isAvailable || past
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-neutral-200 text-neutral-700 hover:bg-brand-green hover:text-white cursor-pointer"
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay horarios disponibles para este día.
          </p>
        )}
      </div>
    </div>
  );
};
