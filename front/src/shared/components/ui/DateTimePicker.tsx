import "@/styles/day-picker.css";
import React, { useState } from "react";
import Select, {
  components,
  SingleValueProps,
  PlaceholderProps,
} from "react-select";
import { CalendarDaysIcon, ClockIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- Tipos para TimePicker ---
interface TimeOption {
  value: string;
  label: string;
}

// --- Props for the components ---
interface DatePickerProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  variant?: "default" | "hero";
}

// --- Style Definitions (from Searchbar.tsx) ---
const inputClass =
  "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none";
const iconClass =
  "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600";

// --- Custom DatePicker Component ---
export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();
  const tomorrow = addDays(new Date(), 1);

  const handleSelect = (date: Date | undefined) => {
    onSelectDate(date);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <CalendarDaysIcon className={iconClass} />
      <input
        type="text"
        readOnly
        value={selectedDate ? format(selectedDate, "PP", { locale: es }) : ""}
        onClick={() => setIsOpen(!isOpen)}
        placeholder="Fecha"
        className={cn(inputClass, "cursor-pointer")}
      />
      {isOpen && (
        <div className="absolute z-10 mt-2 w-auto bg-white rounded-lg border border-gray-200 shadow-lg">
          <div className="p- flex gap-2 border-b">
            <button
              onClick={() => handleSelect(today)}
              className="px-3 py-1 text-xs font-semibold text-white bg-brand-orange rounded-md hover:bg-opacity-90 cursor-pointer m-1"
            >
              Hoy
            </button>
            <button
              onClick={() => handleSelect(tomorrow)}
              className="px-3 py-1 text-xs font-semibold text-white bg-brand-orange rounded-md hover:bg-opacity-90 cursor-pointer m-1"
            >
              Mañana
            </button>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className="p-2"
            locale={es}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
};

// --- Custom TimePicker Component with react-select ---
export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  variant = "default",
}) => {
  // Generar las opciones de tiempo
  const timeOptions: TimeOption[] = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8;
    const timeValue = `${hour.toString().padStart(2, "0")}:00`;
    return {
      value: timeValue,
      label: timeValue,
    };
  });

  // Encontrar la opción seleccionada
  const selectedTimeOption =
    timeOptions.find((option) => option.value === value) || null;

  // Componente personalizado para el valor seleccionado
  const CustomSingleValue = (props: SingleValueProps<TimeOption>) => {
    return (
      <components.SingleValue {...props}>
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 mr-3 text-neutral-500" />
          <span>{props.data.label}</span>
        </div>
      </components.SingleValue>
    );
  };

  // Componente personalizado para el placeholder
  const CustomPlaceholder = (props: PlaceholderProps<TimeOption>) => {
    return (
      <components.Placeholder {...props}>
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 mr-3 text-neutral-500" />
          <span className="text-neutral-700">Hora</span>
        </div>
      </components.Placeholder>
    );
  };

  return (
    <div className="relative w-full cursor-pointer">
      <Select<TimeOption>
        instanceId="time-select"
        options={timeOptions}
        value={selectedTimeOption}
        onChange={(selectedOption) => onChange(selectedOption?.value || "")}
        isSearchable={false}
        placeholder="Hora"
        components={{
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
          valueContainer: () => "pl-3 pr-1 cursor-pointer",
          placeholder: () => "text-neutral-700 cursor-pointer",
          input: () => "text-neutral-900 m-0 cursor-pointer",
          singleValue: () => "text-neutral-900 cursor-pointer",
          menu: () =>
            "bg-white border border-neutral-200 rounded-md shadow-lg mt-1 z-10 cursor-pointer",
          option: () => "px-4 py-2 cursor-pointer",
          dropdownIndicator: () => "text-neutral-600 pr-1 cursor-pointer",
        }}
      />
    </div>
  );
};
