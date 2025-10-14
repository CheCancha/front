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
import { cn } from "@/shared/lib/utils";

// --- Tipos ---
interface TimeOption {
  value: string;
  label: string;
}

// --- Props  ---
interface DatePickerProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  variant?: "default" | "hero";
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  variant?: "default" | "hero";
}

// --- Componente DatePicker con estilo unificado ---
export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onSelectDate,
  variant,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  const tomorrow = addDays(new Date(), 1);

  const handleSelect = (date: Date | undefined) => {
    onSelectDate(date);
    setIsOpen(false);
  };

  const inputBaseClass =
    "w-full pl-10 pr-4 py-3 border rounded-md hover:border-brand-orange outline-none transition-colors cursor-pointer";
  const inputThemeClass =
    "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500";

  return (
    <div className="relative w-full">
      <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
      <input
        type="text"
        readOnly
        value={selectedDate ? format(selectedDate, "PP", { locale: es }) : ""}
        onClick={() => setIsOpen(!isOpen)}
        placeholder="Fecha"
        className={cn(inputBaseClass, inputThemeClass)}
      />
      {isOpen && (
        <div className="absolute z-10 mt-2 w-auto rounded-lg border shadow-lg bg-white border-gray-200">
          <div className="p-1 flex gap-2 border-b border-gray-200">
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
            classNames={{
              day: "text-brand-dark",
              day_today: "text-brand-orange font-bold",
              day_selected:
                "bg-brand-orange text-white hover:bg-brand-orange hover:text-white focus:bg-brand-orange focus:text-white",
              day_disabled: "text-gray-300",
              caption_label: "text-brand-dark font-medium",
              nav_button: "text-gray-600",
              head_cell: "text-gray-500 font-normal text-sm",
            }}
            locale={es}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
};

// --- Componente TimePicker con estilo unificado ---
export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  variant,
}) => {
  const timeOptions: TimeOption[] = [];
  for (let h = 0; h < 24; h++) {
    const hour = String(h).padStart(2, "0");
    timeOptions.push({ value: `${hour}:00`, label: `${hour}:00` });
    if (h < 24) {
      timeOptions.push({ value: `${hour}:30`, label: `${hour}:30` });
    }
  }

  const selectedTimeOption =
    timeOptions.find((option) => option.value === value) || null;

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
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "white",
            borderColor: "#d4d4d4", // neutral-300
            paddingTop: "5.5px",
            paddingBottom: "5.5px",
            borderRadius: "0.375rem",
            transition: "border-color 0.3s",
            "&:hover": { borderColor: "#f97316" },
            boxShadow: "none",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#171717", // neutral-900
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "white",
            zIndex: 10,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#f3f4f6" : "transparent", // gray-100
            color: "#171717", // neutral-900
            cursor: "pointer",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#404040", // neutral-700
          }),
        }}
      />
    </div>
  );
};
