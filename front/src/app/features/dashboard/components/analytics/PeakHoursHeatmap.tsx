"use client";

import React from "react";

type HeatmapProps = {
  data: { [day: number]: { [hour: number]: number } };
  dayLabels: string[];
  hourLabels: string[];
};

const getColorForValue = (value: number | undefined, max: number) => {
  if (!value || value === 0) return "bg-gray-100 dark:bg-gray-800";
  const intensity = Math.min(value / max, 1);
  if (intensity < 0.2) return "bg-blue-200";
  if (intensity < 0.4) return "bg-blue-300";
  if (intensity < 0.6) return "bg-blue-400";
  if (intensity < 0.8) return "bg-blue-500";
  return "bg-blue-600";
};

export function PeakHoursHeatmap({
  data,
  dayLabels,
  hourLabels,
}: HeatmapProps) {
  const allValues = Object.values(data).flatMap((hourData) =>
    Object.values(hourData)
  );
  const maxValue = Math.max(...allValues, 1);

  return (
    // --- CONTENEDOR RESPONSIVE ---
    <div className="overflow-x-auto pb-2">
      <div
        className="grid gap-1 min-w-[700px]"
        style={{ gridTemplateColumns: `auto repeat(${hourLabels.length}, 1fr)` }}
      >
        {/* Fila de Encabezados de Horas */}
        <div />
        {hourLabels.map((hour) => (
          <div
            key={hour}
            className="text-center text-xs font-medium text-gray-500"
          >
            {hour}
          </div>
        ))}

        {/* Filas de Días y Celdas de Calor */}
        {dayLabels.map((day, dayIndex) => (
          <React.Fragment key={day}>
            <div className="text-right text-xs font-medium text-gray-500 pr-2 flex items-center justify-end">
              <span>{day}</span>
            </div>
            {hourLabels.map((hour) => {
              const hourNumber = parseInt(hour.split(":")[0]);
              const value = data[dayIndex]?.[hourNumber];
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`w-full aspect-square rounded-sm ${getColorForValue(
                    value,
                    maxValue
                  )}`}
                  title={`${day} ${hour}: ${value || 0} reserva(s)`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
