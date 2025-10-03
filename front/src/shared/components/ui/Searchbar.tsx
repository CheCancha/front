"use client";

import "@/styles/day-picker.css";
import React, { useState, useEffect, useMemo } from "react";
import Select, {
  OptionProps,
  SingleValueProps,
  PlaceholderProps,
  components,
} from "react-select";
import { FaQuestionCircle } from "react-icons/fa";
import { MapPinIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PiSoccerBall, PiVolleyball } from "react-icons/pi";
import { MdSportsTennis } from "react-icons/md";
import { IoBasketballOutline, IoTennisballOutline } from "react-icons/io5";
import { cn } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker, TimePicker } from "./DateTimePicker";
import toast from "react-hot-toast";

// --- Tipos y Opciones para el Select ---
interface ApiSport {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}
interface SportOption {
  value: string;
  label: string;
  icon: React.ElementType;
}
interface CitySuggestion {
  nombre: string;
  provincia: string;
}

const iconMap: { [key: string]: React.ElementType } = {
  "futbol-5": PiSoccerBall,
  "futbol-7": PiSoccerBall,
  "futbol-11": PiSoccerBall,
  "padel": IoTennisballOutline,
  "basquet": IoBasketballOutline,
  "tenis": MdSportsTennis,
  "voley": PiVolleyball,
};

// --- Interfaz de Props ---
interface SearchBarProps {
  className?: string;
  variant?: "default" | "hero";
  initialCity?: string;
  initialSport?: string;
  initialDate?: Date;
  initialTime?: string;
}

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
// Implementamos una versión genérica y segura de 'debounce' sin usar 'any'.
const debounce = <Params extends unknown[]>(
  func: (...args: Params) => unknown,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Params): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  variant = "default",
  initialCity = "Tostado",
  initialSport = "",
  initialDate,
  initialTime = "",
}) => {
  const router = useRouter();
  const [city, setCity] = useState(initialCity);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(initialTime);
  const [sportOptions, setSportOptions] = useState<SportOption[]>([]);
  const [isLoadingSports, setIsLoadingSports] = useState(true);
  const [sport, setSport] = useState<SportOption | null>(null);
  const [cityQuery, setCityQuery] = useState(initialCity);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [isCityInputFocused, setIsCityInputFocused] = useState(false);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch('/api/sports');
        const data: ApiSport[] = await response.json();
        
        const options = data.map(s => ({
          value: s.slug,
          label: s.name,
          icon: iconMap[s.slug] || FaQuestionCircle,
        }));
        setSportOptions(options);

        if (initialSport) {
            const initialOption = options.find(opt => opt.value === initialSport);
            if (initialOption) setSport(initialOption);
        }

      } catch (error) {
        console.error("Error al cargar los deportes:", error);
      } finally {
        setIsLoadingSports(false);
      }
    };

    fetchSports();
  }, [initialSport]);


  const fetchCitySuggestions = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setCitySuggestions([]);
          return;
        }
        try {
          const response = await fetch(`/api/cities?query=${encodeURIComponent(query)}`);
          const data = await response.json();
          setCitySuggestions(data.cities || []);
        } catch (error) {
          console.error("Error fetching city suggestions:", error);
        }
      }, 200),
    [] 
  );

  useEffect(() => {
    fetchCitySuggestions(cityQuery);
  }, [cityQuery, fetchCitySuggestions]);

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCityQuery(e.target.value);
    setCity(e.target.value);
  };
  
  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    const fullCityName = `${suggestion.nombre}, ${suggestion.provincia}`;
    setCityQuery(fullCityName);
    setCity(fullCityName);
    setCitySuggestions([]);
    setIsCityInputFocused(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (city) params.set("city", city.split(',')[0].trim());
    if (sport) params.set("sport", sport.value);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (time) params.set("time", time);
    
    if (!city) {
      toast.error("Por favor, selecciona una ciudad para buscar.");
      return;
    }

    router.push(`/canchas?${params.toString()}`);
  };

  // El resto del componente (clases de Tailwind y JSX) no necesita cambios...
  const containerClass =
    variant === "hero"
      ? "bg-white text-neutral-900 rounded-lg p-4 shadow-sm max-w-7xl mx-auto"
      : "bg-white text-neutral-900 rounded-lg p-4 shadow-sm max-w-8xl mx-auto";

  const inputClass =
    variant === "hero"
      ? "w-full pl-10 pr-4 py-3 border border-neutral-400 rounded-md focus:ring-2 focus:ring-brand-orange outline-none"
      : "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none";

  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600";

  const buttonClass =
    variant === "hero"
      ? "w-full lg:col-span-1 bg-brand-orange hover:bg-neutral-950 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer"
      : "w-full lg:col-span-1 bg-brand-orange hover:bg-neutral-950 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer";

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
        {/* Input: Ciudad con Autocompletado */}
        <div className="relative w-full">
          <MapPinIcon className={iconClass} />
          <input
            type="text"
            placeholder="Ciudad"
            value={cityQuery}
            onChange={handleCityInputChange}
            onFocus={() => setIsCityInputFocused(true)}
            onBlur={() => setTimeout(() => setIsCityInputFocused(false), 200)} // Añadimos un pequeño delay al blur
            required
            className={inputClass}
          />
          {isCityInputFocused && citySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
              {citySuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.nombre}, {suggestion.provincia}
                </div>
              ))}
            </div>
          )}
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
            isLoading={isLoadingSports}
            loadingMessage={() => 'Cargando deportes...'}
            noOptionsMessage={() => 'No hay deportes disponibles.'}
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
