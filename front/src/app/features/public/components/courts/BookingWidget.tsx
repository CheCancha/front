"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { format, addDays, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import type {
  ComplexProfileData,
  CourtWithPriceRules,
  ValidStartTime,
} from "@/app/(public)/canchas/[slug]/page";
import { Clock, ArrowRight, Calendar, Tag } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// --- TIPOS ---
interface BookingWidgetProps {
  club: ComplexProfileData;
  onSlotClick: (court: CourtWithPriceRules, time: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

// --- SUB-COMPONENTES PARA CLARIDAD ---
const DateSlider = ({
  selectedDate,
  setSelectedDate,
}: {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) => {
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDate]);

  return (
    <div>
      <h3 className="text-md font-semibold text-paragraph mb-2 flex items-center gap-2">
        <Calendar size={16} /> 1. Elegí el día
      </h3>
      <div className="flex space-x-3 overflow-x-auto pb-1 -mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {dates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              ref={isSelected ? selectedRef : null}
              key={index}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all duration-200 border-2",
                isSelected
                  ? "bg-brand-orange border-brand-orange text-brand-dark"
                  : "bg-white border-gray-200 text-gray-700 hover:border-brand-orange"
              )}
            >
              <span className="font-bold text-2xl">{format(date, "d")}</span>
              <span className="text-xs font-semibold uppercase">
                {isToday(date) ? "Hoy" : format(date, "EEE", { locale: es })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimeSlots = ({
  validStartTimes,
  selectedCourt,
  selectedTime,
  onTimeSelect,
  isLoading,
  isSelectedDateToday,
}: {
  validStartTimes: ValidStartTime[];
  selectedCourt: CourtWithPriceRules;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isLoading: boolean;
  isSelectedDateToday: boolean;
}) => {
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const isPast = (time: string) => {
    if (!isSelectedDateToday) return false;
    const [slotHour, slotMinute] = time.split(":").map(Number);
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMinute < currentMinute) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        Cargando disponibilidad...
      </div>
    );
  }

  const availableSlotsForCourt = validStartTimes.filter((slot) => {
    const courtStatus = slot.courts.find((c) => c.courtId === selectedCourt.id);
    return courtStatus?.available && !isPast(slot.time);
  });

  if (availableSlotsForCourt.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-center text-gray-500 bg-gray-50 rounded-lg p-4">
        <p>No hay horarios disponibles para esta cancha y día.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-md font-semibold text-paragraph mb-2 flex items-center gap-2">
        <Clock size={18} /> 3. Seleccioná un horario de inicio
      </h3>
      <div className="flex space-x-3 overflow-x-auto pb-3 -mb-3">
        {availableSlotsForCourt.map((slot) => {
          const isSelected = selectedTime === slot.time;
          return (
            <button
              key={slot.time}
              onClick={() => onTimeSelect(slot.time)}
              className={cn(
                "flex-shrink-0 px-5 py-2 rounded-lg text-center font-semibold transition-colors text-sm border-2",
                isSelected
                  ? "bg-brand-orange border-brand-orange text-brand-dark shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-brand-orange"
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (WIDGET MÓVIL) ---
const MobileBookingWidget: React.FC<BookingWidgetProps> = ({
  club,
  onSlotClick,
  selectedDate,
  setSelectedDate,
}) => {
  const [selectedCourt, setSelectedCourt] =
    useState<CourtWithPriceRules | null>(club.courts[0] || null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [validStartTimes, setValidStartTimes] = useState<ValidStartTime[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!club.slug || !selectedDate) return;
      setIsAvailabilityLoading(true);
      setSelectedTime(null);
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

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedCourt]);

  const handleTimeSelection = (time: string) => {
    setSelectedTime(selectedTime === time ? null : time);
  };

  const handleProceedToBooking = () => {
    if (selectedCourt && selectedTime) {
      onSlotClick(selectedCourt, selectedTime);
    }
  };

  const selectedPriceRule = useMemo(() => {
    if (!selectedTime || !selectedCourt) return null;
    const [hour] = selectedTime.split(":").map(Number);
    return selectedCourt.priceRules.find(
      (rule) => hour >= rule.startTime && hour < rule.endTime
    );
  }, [selectedTime, selectedCourt]);

  if (!selectedCourt) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center text-gray-500 lg:hidden">
        Este complejo no tiene canchas configuradas.
      </div>
    );
  }

  return (
    <div className="lg:hidden">
      {/* Se oculta en pantallas grandes */}
      <div className="p-4 space-y-6">
        <DateSlider
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {club.courts.length > 1 && (
          <div>
            <h3 className="text-md font-semibold text-paragraph mb-2 flex items-center gap-2">
              <Tag size={18} /> 2. Elegí la cancha
            </h3>
            <div className="flex space-x-2 overflow-x-auto">
              {club.courts.map((court) => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourt(court)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors",
                    selectedCourt.id === court.id
                      ? "bg-brand-orange border-brand-orange text-brand-dark"
                      : "bg-white border-gray-200 text-gray-700"
                  )}
                >
                  {court.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <TimeSlots
          validStartTimes={validStartTimes}
          selectedCourt={selectedCourt}
          selectedTime={selectedTime}
          onTimeSelect={handleTimeSelection}
          isLoading={isAvailabilityLoading}
          isSelectedDateToday={isToday(selectedDate)}
        />
      </div>
      {/* --- FOOTER PEGAJOSO --- */}
      <AnimatePresence>
        {selectedTime && selectedPriceRule && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-10"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 ">
              <div>
                <p className="text-gray-600 text-sm">Precio de seña:</p>
                <p className="font-bold text-xl text-brand-dark">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    useGrouping: false,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(selectedPriceRule.price)}
                </p>
              </div>
              <Button size="lg" onClick={handleProceedToBooking}>
                Reservar ahora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (WIDGET DESKTOP) ---
const DesktopBookingWidget: React.FC<BookingWidgetProps> = ({
  club,
  onSlotClick,
  selectedDate,
  setSelectedDate,
}) => {
  const [selectedCourt, setSelectedCourt] =
    useState<CourtWithPriceRules | null>(club.courts[0] || null);
  const [validStartTimes, setValidStartTimes] = useState<ValidStartTime[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!club.slug || !selectedDate) return;
      setIsAvailabilityLoading(true);
      setSelectedTime(null);
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

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedCourt]);

  const handleTimeSelection = (time: string) => {
    setSelectedTime(selectedTime === time ? null : time);
  };

  const handleProceedToBooking = () => {
    if (selectedCourt && selectedTime) {
      onSlotClick(selectedCourt, selectedTime);
    }
  };

  if (!selectedCourt) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center text-gray-500 hidden lg:block">
        Este complejo no tiene canchas configuradas.
      </div>
    );
  }

  return (
    <div className="hidden lg:block bg-white rounded-2xl p-6 sm:p-8 border border-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
        Reservar un turno
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
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
                    ? "bg-brand-orange text-brand-dark border-brand-orange shadow-md"
                    : "bg-gray-50 text-foreground border-gray-200 hover:border-brand-orange hover:bg-orange-50 cursor-pointer"
                )}
              >
                {court.name}
              </button>
            ))}
          </div>
        </div>
      </div>

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
              const isSelected = selectedTime === slot.time;

              const isSelectedDateToday = isToday(selectedDate);
              const currentHour = new Date().getHours();
              const currentMinute = new Date().getMinutes();
              const isPast = (time: string) => {
                if (!isSelectedDateToday) return false;
                const [slotHour, slotMinute] = time.split(":").map(Number);
                if (slotHour < currentHour) return true;
                if (slotHour === currentHour && slotMinute < currentMinute)
                  return true;
                return false;
              };
              const past = isPast(slot.time);

              return (
                <button
                  key={slot.time}
                  disabled={!isAvailable || past}
                  onClick={() => handleTimeSelection(slot.time)}
                  className={cn(
                    "p-3 rounded-md text-center font-semibold transition-colors text-sm",
                    (!isAvailable || past) &&
                      "bg-gray-100 text-gray-400 cursor-not-allowed",
                    isAvailable &&
                      !past &&
                      !isSelected &&
                      "bg-neutral-200 text-neutral-800 hover:bg-brand-orange hover:text-brand-dark cursor-pointer",
                    isSelected &&
                      "bg-brand-orange ring-2 ring-offset-2 ring-brand-orange"
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

      <div className="mt-8 pt-6 border-t">
        <Button
          size="lg"
          className="w-full"
          disabled={!selectedTime || isAvailabilityLoading}
          onClick={handleProceedToBooking}
        >
          Continuar Reserva <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {selectedTime && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Turno seleccionado: <strong>{selectedCourt.name}</strong> a las
            <strong>{selectedTime} hs</strong>.
          </p>
        )}
      </div>
    </div>
  );
};

export const BookingWidget: React.FC<BookingWidgetProps> = (props) => {
  return (
    <>
      <MobileBookingWidget {...props} />
      <DesktopBookingWidget {...props} />
    </>
  );
};
