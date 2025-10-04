"use client";

import "@/styles/day-picker.css";
// ¡CORRECCIÓN! - Eliminamos 'useCallback' que no se está utilizando.
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
import { useSearchStore } from "@/app/features/public/store/searchStore";

// --- Tipos y Opciones ---
interface ApiSport {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}
export interface SportOption {
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

interface SearchBarProps {
  className?: string;
  variant?: "default" | "hero";
}

// --- ¡CORRECCIÓN DEFINITIVA! ---
// Esta es la forma correcta y completamente segura de tipar una función
// 'debounce' genérica en TypeScript, sin usar 'any'.
const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const SearchBar: React.FC<SearchBarProps> = ({ className, variant = "default" }) => {
  const router = useRouter();

  // El estado ahora vive en Zustand, no en el componente.
  const { city, sport, date, time, setCity, setSport, setDate, setTime } = useSearchStore();

  // Estados locales solo para la UI de este componente (autocompletado, etc.)
  const [sportOptions, setSportOptions] = useState<SportOption[]>([]);
  const [isLoadingSports, setIsLoadingSports] = useState(true);
  const [cityQuery, setCityQuery] = useState(city); // Un input local para el autocompletado
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [isCityInputFocused, setIsCityInputFocused] = useState(false);

  // Sincroniza el input local si el estado global cambia (ej: por la URL)
  useEffect(() => {
    setCityQuery(city);
  }, [city]);

  // Carga las opciones de deportes y sincroniza el deporte desde el estado global
  useEffect(() => {
    const fetchSports = async () => {
      setIsLoadingSports(true);
      try {
        const response = await fetch('/api/sports');
        const data: ApiSport[] = await response.json();
        const options = data.map(s => ({
          value: s.slug,
          label: s.name,
          icon: iconMap[s.slug] || FaQuestionCircle,
        }));
        setSportOptions(options);

        // Si hay un deporte en el store, nos aseguramos de que esté seleccionado
        if (sport) {
            const currentSportOption = options.find(opt => opt.value === sport.value);
            if (currentSportOption) {
              setSport(currentSportOption);
            }
        }
      } catch (error) {
        console.error("Error al cargar los deportes:", error);
      } finally {
        setIsLoadingSports(false);
      }
    };
    fetchSports();
  }, [sport, setSport]);

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
      }, 300),
    []
  );

  useEffect(() => {
    // Solo busca sugerencias si el usuario está escribiendo algo nuevo
    if (cityQuery !== city) {
        fetchCitySuggestions(cityQuery);
    }
  }, [cityQuery, city, fetchCitySuggestions]);

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setCityQuery(newQuery);
  };
  
  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    const fullCityName = `${suggestion.nombre}, ${suggestion.provincia}`;
    setCityQuery(fullCityName); // Actualiza el input visual
    setCity(fullCityName);   // Actualiza el estado global
    setCitySuggestions([]);
    setIsCityInputFocused(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Al hacer la búsqueda, nos aseguramos de que el estado global tenga el valor final del input
    setCity(cityQuery);
    
    const params = new URLSearchParams();

    // Usamos 'cityQuery' para la URL, que es el valor más actualizado del input
    if (cityQuery) params.set("city", cityQuery.split(',')[0].trim());
    if (sport) params.set("sport", sport.value);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (time) params.set("time", time);
    
    if (!cityQuery) {
      toast.error("Por favor, selecciona una ciudad para buscar.");
      return;
    }

    router.push(`/canchas?${params.toString()}`);
  };

  // El resto del componente (JSX, estilos, componentes personalizados) no cambia
  const containerClass =
    variant === "hero"
      ? "bg-white text-neutral-900 rounded-lg p-4 shadow-sm max-w-7xl mx-auto"
      : "bg-white text-neutral-900 rounded-lg p-4 shadow-sm max-w-8xl mx-auto";
  const inputClass =
    "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none";
  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600";
  const buttonClass =
      "w-full lg:col-span-1 bg-brand-orange hover:bg-neutral-950 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300 cursor-pointer";

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
        <div className="relative w-full">
          <MapPinIcon className={iconClass} />
          <input
            type="text"
            placeholder="Ciudad"
            value={cityQuery}
            onChange={handleCityInputChange}
            onFocus={() => setIsCityInputFocused(true)}
            onBlur={() => setTimeout(() => setIsCityInputFocused(false), 200)}
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
                    ? "border-neutral-400"
                    : "border-neutral-300"
                ),
                valueContainer: () => "pl-3 pr-1",
                menu: () => "bg-white border border-neutral-200 rounded-md shadow-lg mt-1 z-10",
                option: () => "px-4 py-2 cursor-pointer",
                dropdownIndicator: () => "text-neutral-600 pr-1",
            }}
          />
        </div>
        <DatePicker selectedDate={date} onSelectDate={setDate} />
        <TimePicker value={time} onChange={setTime} variant={variant} />
        <button type="submit" className={buttonClass}>
          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
          Buscar
        </button>
      </form>
    </div>
  );
};