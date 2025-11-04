"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CourtSelector } from "./CourtSelector";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/shared/components/ui/DateRangePicker";

type Court = {
  id: string;
  name: string;
};

// El componente ahora necesita recibir las canchas disponibles
export function AnalyticsFilters({
  availableCourts,
}: {
  availableCourts: Court[];
  isLoading?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- Lógica para leer el estado actual desde la URL ---
  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");
  const currentCourtIds = searchParams.get("courtIds")?.split(",") || [];

  const dateRange: DateRange | undefined =
    currentFrom && currentTo
      ? { from: parseISO(currentFrom), to: parseISO(currentTo) }
      : undefined;

  // --- Lógica para actualizar la URL cuando cambian los filtros ---
  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) {
      params.set("from", format(range.from, "yyyy-MM-dd"));
    } else {
      params.delete("from");
    }
    if (range?.to) {
      params.set("to", format(range.to, "yyyy-MM-dd"));
    } else {
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCourtChange = (ids: string[]) => {
    updateSearchParams("courtIds", ids.length > 0 ? ids.join(",") : null);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-2 px-4 bg-white rounded-lg border shadow-sm">
      <p className="font-medium text-sm text-gray-600">Filtrar por:</p>
      <DatePickerWithRange date={dateRange} onDateChange={handleDateChange} />
      <CourtSelector
        courts={availableCourts}
        selectedCourtIds={currentCourtIds}
        onSelectionChange={handleCourtChange}
      />
    </div>
  );
}
