"use client";

import React from "react";

type HeatmapProps = {
  data: { [day: number]: { [hour: number]: number } };
  dayLabels: string[];
  hourLabels: string[];
};

// --- FUNCIÓN DE COLOR CON TU PALETA DE NARANJAS ---
const getColorForValue = (value: number | undefined, max: number) => {
  if (!value || value === 0) return "bg-gray-100";
  const intensity = Math.min(value / max, 1);
  if (intensity < 0.2) return "bg-orange-200";
  if (intensity < 0.4) return "bg-orange-300";
  if (intensity < 0.6) return "bg-orange-400";
  if (intensity < 0.8) return "bg-orange-500";
  return "bg-orange-600";
};

export function PeakHoursHeatmap({
  data,
  dayLabels,
  hourLabels,
}: HeatmapProps) {

  if (!data || Object.keys(data).length === 0 || !dayLabels || !hourLabels) {
    return (
        <div className="h-40 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">No hay datos de reservas para mostrar en este período.</p>
        </div>
    );
  }

  const allValues = Object.values(data).flatMap((hourData) =>
    Object.values(hourData)
  );
  const maxValue = Math.max(...allValues, 1);

  return (
    <div className="flex flex-col items-center mx-auto">
      <div className="overflow-x-auto pb-2 w-full">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `auto repeat(${hourLabels.length}, minmax(0, 2rem))` }}
        >
          {/* Fila de Encabezados de Horas */}
          <div />
          {hourLabels.map((hour) => (
            <div
              key={hour}
              className="text-center text-xs font-medium text-gray-500"
            >
              {hour.split(":")[0]}h
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
                    className={`w-full aspect-square rounded ${getColorForValue(
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
      
      {/* LEYENDA DE COLOR */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
        <span>Menos popular</span>
        <div className="flex">
            <div className="w-3 h-3 rounded-sm bg-orange-200" />
            <div className="w-3 h-3 rounded-sm bg-orange-300" />
            <div className="w-3 h-3 rounded-sm bg-orange-400" />
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <div className="w-3 h-3 rounded-sm bg-orange-600" />
        </div>
        <span>Más popular</span>
      </div>
    </div>
  );
}