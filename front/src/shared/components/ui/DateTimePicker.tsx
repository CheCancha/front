import React from "react";
import Select, {
  components,
  SingleValueProps,
  PlaceholderProps,
  type MenuListProps,
} from "react-select";
import { CalendarDaysIcon, ClockIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";

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
  className?: string;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  variant?: "default" | "hero";
  className?: string;
}

// --- Componente DatePicker con estilo unificado ---
export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onSelectDate,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  const tomorrow = addDays(new Date(), 1);

  const handleSelect = (date: Date | undefined) => {
    onSelectDate(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative w-full flex items-center justify-start gap-2 border rounded-md py-3 pl-10 pr-4 bg-white text-left",
            "hover:border-brand-orange border-neutral-300 text-neutral-900 placeholder-neutral-500 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand-orange/40",
            className
          )}
        >
          <CalendarDaysIcon className="absolute left-3 h-5 w-5 text-neutral-500" />
          {selectedDate ? (
            <span>{format(selectedDate, "PP", { locale: es })}</span>
          ) : (
            <span className="text-neutral-500">Fecha</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg"
      >
        <div className="p-2 flex gap-2 border-b border-gray-200">
          <Button
            size="sm"
            className="text-xs font-semibold bg-brand-orange text-white hover:bg-brand-orange/90"
            onClick={() => handleSelect(today)}
          >
            Hoy
          </Button>
          <Button
            size="sm"
            className="text-xs font-semibold bg-brand-orange text-white hover:bg-brand-orange/90"
            onClick={() => handleSelect(tomorrow)}
          >
            Mañana
          </Button>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={es}
          disabled={{ before: new Date() }}
          className="p-2"
          classNames={{
            day_selected:
              "bg-brand-orange text-white hover:bg-brand-orange focus:bg-brand-orange",
            day_today: "text-brand-orange font-semibold",
            head_cell: "text-gray-500 font-normal text-sm",
            caption_label: "text-brand-dark font-medium",
            nav_button: "text-gray-600",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

// --- Componente TimePicker con estilo unificado ---
export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  variant,
  className,
}) => {
  const timeOptions: TimeOption[] = [];
  for (let h = 0; h < 24; h++) {
    const hour = String(h).padStart(2, "0");
    timeOptions.push({ value: `${hour}:00`, label: `${hour}:00` });
    timeOptions.push({ value: `${hour}:30`, label: `${hour}:30` });
  }

  const selectedTimeOption =
    timeOptions.find((option) => option.value === value) || null;

  const CustomSingleValue = (props: SingleValueProps<TimeOption>) => (
    <components.SingleValue {...props}>
      <div className="flex items-center">
        <ClockIcon className="h-5 w-5 mr-3 text-neutral-500" />
        <span>{props.data.label}</span>
      </div>
    </components.SingleValue>
  );

  const CustomPlaceholder = (props: PlaceholderProps<TimeOption>) => (
    <components.Placeholder {...props}>
      <div className="flex items-center">
        <ClockIcon className="h-5 w-5 mr-3 text-neutral-500" />
        <span className="text-neutral-700">Hora</span>
      </div>
    </components.Placeholder>
  );

  const CustomMenuList = (props: MenuListProps<TimeOption>) => (
    <components.MenuList
      {...props}
      innerProps={{
        ...props.innerProps,
        onWheel: (e: React.WheelEvent) => {
          e.stopPropagation();
        },
        style: {
          ...(props.innerProps?.style || {}),
          maxHeight: 200,
          overflowY: "auto",
          scrollBehavior: "smooth",
        },
      }}
    />
  );

  return (
    <div className={cn("relative w-full cursor-pointer", className)}>
      <Select<TimeOption>
        instanceId="time-select"
        options={timeOptions}
        value={selectedTimeOption}
        onChange={(opt) => onChange(opt?.value || "")}
        isSearchable={false}
        placeholder="Hora"
        menuPortalTarget={
          typeof window !== "undefined" ? document.body : undefined
        }
        menuPosition="fixed"
        menuShouldBlockScroll
        maxMenuHeight={200}
        components={{
          SingleValue: CustomSingleValue,
          Placeholder: CustomPlaceholder,
          IndicatorSeparator: () => null,
          MenuList: CustomMenuList,
        }}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "white",
            borderColor: "#d4d4d4",
            paddingTop: "5.5px",
            paddingBottom: "5.5px",
            borderRadius: "0.375rem",
            transition: "border-color 0.3s",
            "&:hover": { borderColor: "#f97316" },
            boxShadow: "none",
          }),
          singleValue: (base) => ({ ...base, color: "#171717" }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          menu: (base) => ({ ...base, backgroundColor: "white" }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#f3f4f6" : "transparent",
            color: "#171717",
            cursor: "pointer",
          }),
          placeholder: (base) => ({ ...base, color: "#404040" }),
        }}
      />
    </div>
  );
};
