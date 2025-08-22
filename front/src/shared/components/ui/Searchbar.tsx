"use client";

import React, { useState } from 'react';
import { MapPinIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Volleyball } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker, TimePicker } from "./DateTimePicker"; // Asumo que este archivo ya existe en la misma carpeta

// --- Interfaz de Props ---
// En un futuro, podrías pasar los valores y los setters como props para un mayor control
interface SearchBarProps {
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  // El estado se maneja internamente para que el componente sea autocontenido
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En una aplicación real, aquí navegarías a la página de resultados con los parámetros de búsqueda
    // router.push(`/courts?city=${city}&sport=${sport}...`);
    alert(`Buscando: ${sport || 'cualquier deporte'} en ${city || 'cualquier ciudad'} para el ${date?.toLocaleDateString()} a las ${time || 'cualquier hora'}`);
  };

  return (
    <div className={cn("bg-background text-neutral-900 rounded-lg p-4 max-w-7xl mx-auto shadow-sm", className)}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        {/* Input: Ciudad */}
        <div className="relative w-full lg:col-span-1">
          <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600" />
          <input
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none"
          />
        </div>

        {/* Input: Deporte */}
        <div className="relative w-full lg:col-span-1">
          <Volleyball className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600" />
          <select
            className={cn(
              "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none cursor-pointer appearance-none",
              !sport ? "text-neutral-500" : "text-neutral-900"
            )}
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option value="" disabled>Deporte</option>
            <option value="futbol">Fútbol</option>
            <option value="padel">Pádel</option>
            <option value="basquet">Básquet</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600 pointer-events-none" />
        </div>

        {/* Input: Fecha */}
        <div className="lg:col-span-1">
          <DatePicker selectedDate={date} onSelectDate={setDate} />
        </div>

        {/* Input: Hora */}
        <div className="lg:col-span-1">
          <TimePicker value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        {/* Botón de Búsqueda (CTA) */}
        <button
          type="submit"
          className="w-full lg:col-span-1 bg-brand-orange hover:bg-opacity-90 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer"
        >
          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
          Buscar
        </button>
      </form>
    </div>
  );
};
