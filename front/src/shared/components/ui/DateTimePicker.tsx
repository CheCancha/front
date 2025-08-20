import React, { useState } from "react";
import { CalendarDaysIcon, ClockIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

// --- Props para los componentes ---
interface DatePickerProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

interface TimePickerProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

// --- Componente DatePicker Personalizado ---
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
      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
        <CalendarDaysIcon className="w-5 h-5 text-neutral-500" />
      </div>
      <input
        type="text"
        readOnly
        value={selectedDate ? format(selectedDate, "PP", { locale: es }) : ""}
        onClick={() => setIsOpen(!isOpen)}
        placeholder="Fecha"
        className="w-full cursor-pointer bg-background border border-neutral-400 text-neutral-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block ps-10 p-4"
      />
      {isOpen && (
        <div className="absolute z-10 mt-2 w-auto bg-white rounded-lg border border-gray-200">
          <div className="p- flex gap-2 border-b">
            <button
              onClick={() => handleSelect(today)}
              className="px-3 py-1 text-xs font-semibold text-neutral-900 bg-brand-blue rounded-md hover:bg-gray-200 cursor-pointer m-1"
            >
              Hoy
            </button>
            <button
              onClick={() => handleSelect(tomorrow)}
              className="px-3 py-1 text-xs font-semibold text-neutral-900 bg-brand-blue rounded-md hover:bg-gray-200 cursor-pointer m-1"
            >
              Mañana
            </button>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={es}
            disabled={{ before: today }}
            styles={{
              caption: { color: "#ff000", fontWeight: "bold" },
              head: { color: "#01c780" },
              day_selected: { backgroundColor: "#01c780", color: "white" },
              day_today: { color: "#01c780", fontWeight: "bold" },
            }}
          />
        </div>
      )}
    </div>
  );
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
        <ClockIcon className="w-5 h-5 text-neutral-500" />
      </div>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-background p-4 border border-neutral-400 text-neutral-600 text-sm rounded-lg focus:ring-brand-blue focus:border-blue-500 block ps-10 cursor-pointer"
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
    </div>
  );
};
