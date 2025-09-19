import "@/styles/day-picker.css";
import React, { useState } from "react";
import { CalendarDaysIcon, ClockIcon } from "lucide-react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- Props for the components ---
interface DatePickerProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

interface TimePickerProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

// --- Style Definitions (from Searchbar.tsx) ---
const inputClass = "w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-orange outline-none";
const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600";

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

// --- Custom TimePicker Component ---
export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="relative w-full">
      <ClockIcon className={iconClass} />
      <select
        value={value}
        onChange={onChange}
        className={cn(
            inputClass,
            "cursor-pointer appearance-none",
            !value ? "text-neutral-600" : "text-neutral-900"
          )}
      >
        <option value="" disabled>
          Hora
        </option>
        {timeSlots.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600 pointer-events-none" />
    </div>
  );
};
