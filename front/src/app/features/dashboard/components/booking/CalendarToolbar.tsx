"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Calendar } from "@/shared/components/ui/calendar";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  LayoutList,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";

interface CalendarToolbarProps {
  currentDate: Date;
  view: "day" | "week";
  sportFilter: string;
  sportFilters: string[];
  isRefreshing: boolean;
  onDateChange: (days: number) => void;
  onSelectDate: (date: Date | undefined) => void;
  onGoToToday: () => void;
  onViewChange: (value: "day" | "week") => void;
  onFilterChange: (value: string) => void;
  onRefresh: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  view,
  sportFilter,
  sportFilters,
  isRefreshing,
  onDateChange,
  onSelectDate,
  onGoToToday,
  onViewChange,
  onFilterChange,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
      {/* Controles de Fecha */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(view === "day" ? -1 : -7)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !currentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(currentDate, "eeee d MMM", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={onSelectDate}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(view === "day" ? 1 : 7)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onGoToToday}>
          Hoy
        </Button>
      </div>

      {/* Controles de Vista y Filtro */}
      <div className="flex items-center gap-2">
        <Select value={sportFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por deporte" />
          </SelectTrigger>
          <SelectContent>
            {sportFilters.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(value: "day" | "week") => {
            if (value) onViewChange(value); 
          }}
        >
          <ToggleGroupItem value="day" aria-label="Vista de día">
            <LayoutList className="h-4 w-4 mr-2" />
            Día
          </ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Vista de semana">
            <CalendarDays className="h-4 w-4 ml-2" />
            Semana
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>
    </div>
  );
};