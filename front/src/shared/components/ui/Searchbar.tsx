"use client";

import "@/styles/day-picker.css";
import React, { useState, useEffect, useMemo } from "react";
import Select, {
  OptionProps,
  SingleValueProps,
  PlaceholderProps,
  components,
} from "react-select";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PiSoccerBall, PiVolleyball } from "react-icons/pi";
import { MdSportsTennis } from "react-icons/md";
import { IoBasketballOutline, IoTennisballOutline } from "react-icons/io5";
import { cn } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker, TimePicker } from "./DateTimePicker";
import toast from "react-hot-toast";
import { useSearchStore } from "@/app/features/public/store/searchStore";
import { ButtonPrimary } from "./Buttons";

// --- Tipos y Opciones ---
export interface SportOption {
  value: string;
  label: string;
  icon: React.ElementType;
}
interface CitySuggestion {
  nombre: string;
  provincia: string;
  type?: "city" | "complex";
  slug?: string;
}

interface CityAPIResponse {
  nombre: string;
  provincia: string;
}

interface ComplexAPIResponse {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    setCityQuery(city);
  }, [city]);

  const fetchCitySuggestions = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setCitySuggestions([]);
          setIsLoadingSuggestions(false);
          return;
        }
        setIsLoadingSuggestions(true);
        try {
          // --- Ciudades ---
          const citiesResponse = await fetch(
            `/api/cities?query=${encodeURIComponent(query)}`
          );
          const citiesData = (await citiesResponse.json()) as {
            cities: CityAPIResponse[];
          };

          // --- Complejos ---
          const complexesResponse = await fetch(
            `/api/complexes/search?query=${encodeURIComponent(query)}`
          );
          const complexesData = (await complexesResponse.json()) as {
            complexes: ComplexAPIResponse[];
          };

          // --- Combinamos resultados ---
          const citySuggestions: CitySuggestion[] = (
            citiesData.cities || []
          ).map((city: CityAPIResponse) => ({
            nombre: city.nombre,
            provincia: city.provincia,
            type: "city",
          }));

          const complexSuggestions: CitySuggestion[] = (
            complexesData.complexes || []
          )
            .slice(0, 3)
            .map((complex: ComplexAPIResponse) => ({
              nombre: complex.name,
              provincia: complex.city,
              type: "complex",
              slug: complex.slug,
            }));

          setCitySuggestions([...citySuggestions, ...complexSuggestions]);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          // Fallback: si falla el fetch de complejos
          try {
            const response = await fetch(
              `/api/cities?query=${encodeURIComponent(query)}`
            );
            const data = (await response.json()) as {
              cities: CityAPIResponse[];
            };
            setCitySuggestions(
              (data.cities || []).map((city: CityAPIResponse) => ({
                nombre: city.nombre,
                provincia: city.provincia,
                type: "city",
              }))
            );
          } catch (fallbackError) {
            console.error("Error in fallback city fetch:", fallbackError);
          }
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300),
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
    if (suggestion.type === "complex" && suggestion.slug) {
      // Si es un complejo, redirigimos directamente a su página
      router.push(`/canchas/${suggestion.slug}`);
    } else {
      // Si es una ciudad, la seleccionamos para buscar
      const fullCityName = `${suggestion.nombre}, ${suggestion.provincia}`;
      setCityQuery(fullCityName);
      setCity(fullCityName);
      setCitySuggestions([]);
      setIsCityInputFocused(false);
    }
  };

  const handleClearFilters = () => {
    setSport(null);
    setDate(undefined);
    setTime("");
  };

  const hasActiveFilters = sport || date || time;

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

  // --- CLASES DE ESTILO ---
  const containerClass = "w-full max-w-4xl mx-auto";
  const inputClass =
    "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg hover:border-brand-orange focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none bg-white text-neutral-900 placeholder-neutral-500 transition-all text-sm";
  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500";
  const buttonClass =
    "w-full bg-gradient-to-r from-[#e62b02] to-[#fe3719] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer hover:brightness-110 shadow-md text-sm";

  return (
    <div className={cn(containerClass, className)}>
      <form onSubmit={handleSearch} className="space-y-3 md:space-y-0">
        <div className="flex flex-col md:grid md:grid-cols-5 gap-3">
          <div className="flex gap-2 md:col-span-1">
            <div className="relative flex-1">
              <MapPinIcon className={iconClass} />
              <input
                type="text"
                placeholder="Buscar ciudad o club"
                value={cityQuery}
                onChange={handleCityInputChange}
                onFocus={() => setIsCityInputFocused(true)}
                onBlur={() =>
                  setTimeout(() => setIsCityInputFocused(false), 200)
                }
                required
                className={inputClass}
                aria-label="Ciudad o club deportivo"
              />

              {/* Sugerencias de Ciudad */}
              {isCityInputFocused && cityQuery.length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-30 max-h-60 overflow-y-auto">
                  {isLoadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Buscando ciudades y clubes...
                    </div>
                  ) : citySuggestions.length > 0 ? (
                    <>
                      {citySuggestions.some((s) => s.type === "city") && (
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b sticky top-0">
                          CIUDADES
                        </div>
                      )}
                      {citySuggestions
                        .filter((s) => s.type === "city")
                        .map((suggestion, index) => (
                          <div
                            key={`city-${index}`}
                            className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 text-gray-800 text-sm border-b last:border-b-0 transition-colors"
                            onMouseDown={() =>
                              handleSuggestionClick(suggestion)
                            }
                          >
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">
                                {suggestion.nombre}
                              </span>
                              <span className="text-gray-500">
                                • {suggestion.provincia}
                              </span>
                            </div>
                          </div>
                        ))}
                      {citySuggestions.some((s) => s.type === "complex") && (
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b sticky top-0">
                          CLUBES DEPORTIVOS
                        </div>
                      )}
                      {citySuggestions
                        .filter((s) => s.type === "complex")
                        .map((suggestion, index) => (
                          <div
                            key={`complex-${index}`}
                            className="px-4 py-2.5 cursor-pointer hover:bg-orange-50 text-gray-800 text-sm border-b last:border-b-0 transition-colors"
                            onMouseDown={() =>
                              handleSuggestionClick(suggestion)
                            }
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 flex-shrink-0">
                                <PiSoccerBall className="h-4 w-4 text-brand-orange" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {suggestion.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {suggestion.provincia}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No se encontraron ciudades ni clubes
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón de Filtro (Mobile only) */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="md:hidden flex-shrink-0 bg-brand-dark border-2 rounded-lg p-3 transition-all relative"
              aria-label="Mostrar filtros"
              aria-expanded={isMobileFilterOpen}
            >
              <FunnelIcon className="h-5 w-5 transition-colors text-white" />
            </button>
          </div>

          {/* Campos de Desktop (siempre visibles en desktop) */}
          <div className="hidden md:contents">
            <div className="relative">
              <Select<SportOption>
                instanceId="sport-select"
                options={sportOptions}
                value={sport}
                onChange={(selectedOption) => setSport(selectedOption)}
                isSearchable={false}
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue,
                  Placeholder: CustomPlaceholder,
                  IndicatorSeparator: () => null,
                }}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "white",
                    borderColor: state.isFocused ? "#f97316" : "#d4d4d4",
                    borderWidth: "1px",
                    paddingTop: "5.5px",
                    paddingBottom: "5.5px",
                    borderRadius: "0.5rem",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "#f97316" },
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(249, 115, 22, 0.1)"
                      : "none",
                    fontSize: "0.875rem",
                  }),
                  singleValue: (base) => ({ ...base, color: "#171717" }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "white",
                    zIndex: 20,
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? "#f3f4f6"
                      : "transparent",
                    color: "#171717",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }),
                  placeholder: (base) => ({ ...base, color: "#404040" }),
                }}
              />
            </div>

            <DatePicker
              selectedDate={date}
              onSelectDate={setDate}
              variant={variant}
            />

            <TimePicker value={time} onChange={setTime} variant={variant} />

            <ButtonPrimary type="submit" className={buttonClass}>
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Buscar
            </ButtonPrimary>
          </div>
        </div>

        {/* ======================================================= */}
        {/* FILTROS EXPANDIBLES (Solo Mobile) */}
        {/* ======================================================= */}
        {isMobileFilterOpen && (
          <div className="md:hidden space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Header de Filtros con botón de limpiar */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium text-neutral-700">
                  Filtros activos
                </span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-brand-orange hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
            )}

            {/* Deporte */}
            <div className="relative">
              <Select<SportOption>
                instanceId="sport-select-mobile"
                options={sportOptions}
                value={sport}
                onChange={(selectedOption) => setSport(selectedOption)}
                isSearchable={false}
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue,
                  Placeholder: CustomPlaceholder,
                  IndicatorSeparator: () => null,
                }}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "white",
                    borderColor: state.isFocused ? "#f97316" : "#d4d4d4",
                    borderWidth: "1px",
                    paddingTop: "5.5px",
                    paddingBottom: "5.5px",
                    borderRadius: "0.5rem",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "#f97316" },
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(249, 115, 22, 0.1)"
                      : "none",
                    fontSize: "0.875rem",
                  }),
                  singleValue: (base) => ({ ...base, color: "#171717" }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "white",
                    zIndex: 20,
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? "#f3f4f6"
                      : "transparent",
                    color: "#171717",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }),
                  placeholder: (base) => ({ ...base, color: "#404040" }),
                }}
              />
            </div>

            {/* Fecha y Hora en fila */}
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                selectedDate={date}
                onSelectDate={setDate}
                variant={variant}
              />

              <TimePicker value={time} onChange={setTime} variant={variant} />
            </div>
          </div>
        )}

        <div className="md:hidden">
          <ButtonPrimary type="submit" className={buttonClass}>
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            Buscar canchas
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
};
