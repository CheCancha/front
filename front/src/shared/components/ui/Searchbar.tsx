"use client"

import "@/styles/day-picker.css";
import React, { useState, useEffect, useMemo } from "react";
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
import { cn } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker, TimePicker } from "./DateTimePicker";
import toast from "react-hot-toast";
import { useSearchStore } from "@/app/features/public/store/searchStore";

// --- Tipos y Opciones ---
export interface SportOption {
  value: string;
  label: string;
  icon: React.ElementType;
}
interface CitySuggestion {
  nombre: string;
  provincia: string;
}

// --- LISTA DE DEPORTES ---
const sportOptions: SportOption[] = [
    { value: "futbol-5", label: "Fútbol 5", icon: PiSoccerBall },
    { value: "futbol-7", label: "Fútbol 7", icon: PiSoccerBall },
    { value: "futbol-11", label: "Fútbol 11", icon: PiSoccerBall },
    { value: "padel", label: "Pádel", icon: IoTennisballOutline },
    { value: "basquet", label: "Básquet", icon: IoBasketballOutline },
    { value: "tenis", label: "Tenis", icon: MdSportsTennis },
    { value: "voley", label: "Vóley", icon: PiVolleyball },
].sort((a, b) => a.label.localeCompare(b.label));

interface SearchBarProps {
  className?: string;
  variant?: "default" | "hero"; 
}

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

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  variant = "default",
}) => {
  const router = useRouter();
  const { city, sport, date, time, setCity, setSport, setDate, setTime } =
    useSearchStore();

  const [cityQuery, setCityQuery] = useState(city);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [isCityInputFocused, setIsCityInputFocused] = useState(false);

  useEffect(() => {
    setCityQuery(city);
  }, [city]);

  const fetchCitySuggestions = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setCitySuggestions([]);
          return;
        }
        try {
          const response = await fetch(
            `/api/cities?query=${encodeURIComponent(query)}`
          );
          const data = await response.json();
          setCitySuggestions(data.cities || []);
        } catch (error) {
          console.error("Error fetching city suggestions:", error);
        }
      }, 200),
    []
  );

  useEffect(() => {
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
    setCityQuery(fullCityName);
    setCity(fullCityName);
    setCitySuggestions([]);
    setIsCityInputFocused(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCity(cityQuery);

    const params = new URLSearchParams();
    if (cityQuery) params.set("city", cityQuery.split(",")[0].trim());
    if (sport) params.set("sport", sport.value);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (time) params.set("time", time);

    if (!cityQuery) {
      toast.error("Por favor, selecciona una ciudad para buscar.");
      return;
    }

    router.push(`/canchas?${params.toString()}`);
  };

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
  
  // --- INICIO DEL RETURN ---
  const containerClass = "w-full max-w-4xl mx-auto";
  const inputClass = "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md hover:border-brand-orange outline-none bg-white text-neutral-900 placeholder-neutral-500 transition-colors";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500";
  const buttonClass = "w-full lg:col-span-1 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium py-3 px-6 rounded-md flex items-center justify-center transition-all duration-300 cursor-pointer hover:brightness-110";

  return (
    <div className={cn(containerClass, className)}>
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center"
      >
        <div className="relative w-full md:col-span-2 lg:col-span-1">
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
                <div key={index} className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-800" onMouseDown={() => handleSuggestionClick(suggestion)}>
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
            isLoading={false}
            loadingMessage={() => "Cargando deportes..."}
            noOptionsMessage={() => "No hay deportes disponibles."}
            components={{
              Option: CustomOption,
              SingleValue: CustomSingleValue,
              Placeholder: CustomPlaceholder,
              IndicatorSeparator: () => null,
            }}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: 'white',
                borderColor: '#d4d4d4',
                paddingTop: '5.5px',
                paddingBottom: '5.5px',
                borderRadius: '0.375rem',
                transition: 'border-color 0.3s',
                '&:hover': { borderColor: '#f97316' },
                boxShadow: 'none',
              }),
              singleValue: (base) => ({ ...base, color: '#171717' }),
              menu: (base) => ({ ...base, backgroundColor: 'white', zIndex: 20 }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#f3f4f6' : 'transparent', 
                color: '#171717',
                cursor: 'pointer',
              }),
              placeholder: (base) => ({ ...base, color: '#404040' }) 
            }}
          />
        </div>
        
        <DatePicker selectedDate={date} onSelectDate={setDate} variant={variant} />
        <TimePicker value={time} onChange={setTime} variant={variant} />
        
        <button type="submit" className={buttonClass}>
          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
          Buscar
        </button>
      </form>
    </div>
  );
};
