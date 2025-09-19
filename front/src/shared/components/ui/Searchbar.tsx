"use client";

import "@/styles/day-picker.css";
import React, { useState } from "react";
import { MapPinIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Volleyball } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker, TimePicker } from "./DateTimePicker";

// --- Interfaz de Props ---
interface SearchBarProps {
  className?: string;
  variant?: "default" | "hero";
  // Props opcionales para valores iniciales
  initialCity?: string;
  initialSport?: string;
  initialDate?: Date;
  initialTime?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  variant = "default",
  initialCity = "Tostado",
  initialSport = "",
  initialDate = new Date(),
  initialTime = "",
}) => {
  const router = useRouter();
  const [city, setCity] = useState(initialCity);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(initialTime);
  const [sport, setSport] = useState(initialSport);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (sport) params.set("sport", sport);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (time) params.set("time", time);

    // Redirigimos al usuario a la página de resultados con los parámetros
    router.push(`/courts?${params.toString()}`);
  };

  // Estilos condicionales basados en la variante
  const containerClass =
    variant === "hero"
      ? "bg-white text-neutral-900 rounded-lg p-4 shadow-sm max-w-7xl mx-auto"
      : "bg-white text-neutral-900 rounded-lg p-4 shadow-sm max-w-8xl mx-auto";

  const inputClass =
    variant === "hero"
      ? "w-full pl-10 pr-4 py-3 border border-neutral-400 rounded-md focus:ring-2 focus:ring-neutral-950 outline-none"
      : "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none";

  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600";

  const buttonClass =
    variant === "hero"
      ? "w-full lg:col-span-1 bg-brand-orange hover:bg-neutral-950 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer"
      : "w-full lg:col-span-1 bg-brand-orange hover:bg-neutral-950 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer";

  return (
    <div className={cn(containerClass, className)}>
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center"
      >
        {/* Input: Ciudad */}
        <div className="relative w-full">
          <MapPinIcon className={iconClass} />
          <input
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Input: Deporte */}
        <div className="relative w-full">
          <Volleyball className={iconClass} />
          <select
            className={cn(
              inputClass,
              "cursor-pointer appearance-none",
              !sport ? "text-neutral-600" : "text-neutral-900"
            )}
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option value="" disabled>
              Deporte
            </option>
            <option value="FUTBOL">Fútbol</option>
            <option value="PADEL">Pádel</option>
            <option value="BASQUET">Básquet</option>
            <option value="TENIS">Tenis</option>
            <option value="VOLEY">Vóley</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600 pointer-events-none" />
        </div>

        {/* Input: Fecha */}
        <DatePicker selectedDate={date} onSelectDate={setDate} />

        {/* Input: Hora */}
        <TimePicker value={time} onChange={(e) => setTime(e.target.value)} />

        {/* Botón de Búsqueda (CTA) */}
        <button type="submit" className={buttonClass}>
          <MagnifyingGlassIcon className="h-5 w-5 mr-2 " />
          Buscar
        </button>
      </form>
    </div>
  );
};
