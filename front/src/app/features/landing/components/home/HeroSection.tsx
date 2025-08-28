"use client";

import type { FC } from "react";
import Image from "next/image";
import { MapPinIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  DatePicker,
  TimePicker,
} from "../../../../../shared/components/ui/DateTimePicker";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Volleyball } from "lucide-react";
import { cn } from "@/lib/utils"; 

const HeroSection: FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [sport, setSport] = useState("");

  return (
    <div className="w-full h-[80vh] min-h-[600px] my-16 flex items-center justify-center text-background bg-background">
      {/* Contenedor para la Imagen de Fondo */}
      <div className="relative top-0 left-0 w-full h-full rounded-xl overflow-hidden max-w-7xl">
        <Image
          src="/paddle.webp"
          alt="Jugadores de pádel en acción"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="/paddle.webp"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-foreground/70 "></div>
      </div>

      {/* Contenido del Hero */}
      <div className="absolute z-10 w-full max-w-4xl mx-auto text-center px-4 ">
        <h1 className="font-lora text-5xl md:text-7xl font-medium leading-tight mb-4">
          Encontrá tu cancha, reservá tu partido.
        </h1>
        <p className="font-satoshi text-lg md:text-xl text-brand-beige max-w-2xl mx-auto mb-10">
          La forma más fácil de buscar, comparar y reservar canchas de tu
          deporte favorito en tu ciudad.
        </p>

        {/* Barra de Búsqueda Compleja */}
        <div className="bg-background text-neutral-900 rounded-lg p-4 max-w-5xl mx-auto">
          <form className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center">
            {/* Input: Ciudad */}
            <div className="relative w-full">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600" />
              <input
                type="text"
                placeholder="Ciudad"
                className="w-full pl-10 pr-4 py-3 border border-neutral-400 rounded-md focus:ring-2 focus:ring-neutral-950 outline-none"
              />
            </div>

            {/* Input: Deporte */}
            <div className="relative w-full">
              <Volleyball className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600" />
              <select
                className={cn(
                  "w-full pl-10 pr-4 py-3 border border-neutral-400 rounded-md focus:ring-2 focus:ring-neutral-950 outline-none cursor-pointer appearance-none",
                  !sport ? "text-neutral-600" : "text-neutral-900"
                )}
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                <option value="" disabled>
                  Deporte
                </option>
                <option value="futbol">Fútbol</option>
                <option value="padel">Pádel</option>
                <option value="basquet">Básquet</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600 pointer-events-none" />
            </div>

            {/* Input: Fecha */}
            <DatePicker selectedDate={date} onSelectDate={setDate} />

            {/* Input: Hora */}
            <TimePicker
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />

            {/* Botón de Búsqueda (CTA) */}
            <button
              type="submit"
              className="w-full lg:col-span-1 bg-brand-orange hover:bg-opacity-90 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2 " />
              Buscar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
