"use client";

import "@/styles/day-picker.css";
import React, { useState } from "react";
import Select, {
  OptionProps,
  SingleValueProps,
  PlaceholderProps,
  components,
} from "react-select";
import { MapPinIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PiSoccerBall, PiVolleyball } from "react-icons/pi";
import { MdSportsTennis } from "react-icons/md";
import { IoBasketballOutline, IoTennisballOutline } from "react-icons/io5";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker, TimePicker } from "./DateTimePicker";

// --- Tipos y Opciones para el Select ---
interface SportOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

const sportOptions: SportOption[] = [
  { value: "FUTBOL", label: "Fútbol", icon: PiSoccerBall },
  { value: "PADEL", label: "Pádel", icon: IoTennisballOutline },
  { value: "BASQUET", label: "Básquet", icon: IoBasketballOutline },
  { value: "TENIS", label: "Tenis", icon: MdSportsTennis },
  { value: "VOLEY", label: "Vóley", icon: PiVolleyball },
];

// --- Interfaz de Props ---
interface SearchBarProps {
  className?: string;
  variant?: "default" | "hero";
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
  const [sport, setSport] = useState<SportOption | null>(
    initialSport
      ? sportOptions.find((opt) => opt.value === initialSport) || null
      : null
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (sport) params.set("sport", sport.value);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (time) params.set("time", time);

    router.push(`/courts?${params.toString()}`);
  };

  // --- Clases de Tailwind ---
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

  // Componente personalizado para las opciones del menú
  const CustomOption = (props: OptionProps<SportOption>) => {
    const Icon = props.data.icon;
    return (
      <components.Option {...props}>
        <div className="flex items-center">
          <Icon className="h-5 w-5 mr-3 text-neutral-500" />
          <span>{props.label}</span>
        </div>
      </components.Option>
    );
  };

  // Componente personalizado para el valor seleccionado
  const CustomSingleValue = (props: SingleValueProps<SportOption>) => {
    const Icon = props.data.icon;
    return (
      <components.SingleValue {...props}>
        <div className="flex items-center">
          <Icon className="h-5 w-5 mr-3 text-neutral-500" />
          <span>{props.data.label}</span>
        </div>
      </components.SingleValue>
    );
  };

  // Componente personalizado para el placeholder
  const CustomPlaceholder = (props: PlaceholderProps<SportOption>) => {
    return (
      <components.Placeholder {...props}>
        <div className="flex items-center">
          <PiSoccerBall className="h-5 w-5 mr-3 text-neutral-500" />
          <span className="text-neutral-700">Deporte</span>
        </div>
      </components.Placeholder>
    );
  };

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

        {/* Input: Deporte con React-Select */}
        <div className="relative w-full">
          <Select<SportOption>
            instanceId="sport-select"
            options={sportOptions}
            value={sport}
            onChange={(selectedOption) => setSport(selectedOption)}
            isSearchable={false}
            placeholder="Deporte"
            components={{
              Option: CustomOption,
              SingleValue: CustomSingleValue,
              Placeholder: CustomPlaceholder,
              IndicatorSeparator: () => null,
            }}
            classNamePrefix="react-select"
            classNames={{
              control: () =>
                cn(
                  "w-full py-[5.5px] border rounded-md transition-colors cursor-pointer hover:border-brand-orange",
                  variant === "hero"
                    ? "border-neutral-400 cursor-pointer"
                    : "border-neutral-300 cursor-pointer"
                ),
              valueContainer: () => "pl-3 pr-1",
              placeholder: () => "text-neutral-700 cursor-pointer",
              input: () => "text-neutral-900 m-0 cursor-pointer",
              singleValue: () => "text-neutral-900 cursor-pointer",
              menu: () =>
                "bg-white border border-neutral-200 rounded-md shadow-lg mt-1 z-10",
              option: () => "px-4 py-2 cursor-pointer",
              dropdownIndicator: () => "text-neutral-600 pr-1 cursor-pointer",
            }}
          />
        </div>

        {/* Input: Fecha */}
        <DatePicker selectedDate={date} onSelectDate={setDate} />

        {/* Input: Hora */}
        <TimePicker value={time} onChange={setTime} variant={variant} />

        {/* Botón de Búsqueda (CTA) */}
        <button type="submit" className={buttonClass}>
          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
          Buscar
        </button>
      </form>
    </div>
  );
};
