"use client";

import React from "react";

type HeatmapProps = {
  // Las claves (keys) de data son los números de día (0-6)
  data: { [day: number]: { [hour: number]: number } };
  dayLabels: string[];
  hourLabels: string[];
};

// --- FUNCIÓN DE COLOR CON PALETA VERDE LIMA (LIME) ---
const getColorForValue = (value: number | undefined, max: number) => {
  if (!value || value === 0) return "bg-gray-100";
  
  // Aseguramos que effectiveMax sea al menos 1 para evitar problemas de división
  const effectiveMax = max > 1 ? max : 1; 
  const intensity = Math.min(value / effectiveMax, 1);
  
  // Paleta de verdes (Lime Green) de claro a oscuro
  if (intensity < 0.2) return "bg-[#f1ff91]"; // Más claro
  if (intensity < 0.4) return "bg-[#e3ff52]";
  if (intensity < 0.6) return "bg-[#ccfc03]";
  if (intensity < 0.8) return "bg-[#b3e300]";
  
  return "bg-[#8ab600]"; // Más oscuro (pico)
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
  // Aseguramos que maxValue sea al menos 1 para la división en getColorForValue
  const maxValue = Math.max(...allValues, 1);

  return (
    <div className="flex flex-col items-center mx-auto">
      <div className="overflow-x-auto pb-2 w-full">
        <div
          className="grid gap-1.5"
          // Aseguramos que la columna del día sea 'auto' y las de horas 'minmax(0, 2rem)'
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
          {dayLabels.map((day, dayIndex) => {
            // Utilizamos dayIndex como la clave del día, asumiendo que:
            // dayLabels[0] corresponde a data[0]
            // dayLabels[1] corresponde a data[1], etc.
            const dayData = data[dayIndex] || {}; // Usar un objeto vacío si no hay datos para el día

            return (
              <React.Fragment key={day}>
                <div className="text-right text-xs font-medium text-gray-500 pr-2 flex items-center justify-end">
                  <span>{day}</span>
                </div>
                {hourLabels.map((hour) => {
                  const hourNumber = parseInt(hour.split(":")[0]);
                  // Accedemos a los datos de la hora dentro de los datos del día
                  const value = dayData[hourNumber]; 
                  
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
            );
          })}
        </div>
      </div>
      
      {/* LEYENDA DE COLOR */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
        <span>Menos popular</span>
        <div className="flex">
          {/* Actualizando la Leyenda a la paleta Lime */}
          <div className="w-3 h-3 rounded-sm bg-[#f1ff91]" />
          <div className="w-3 h-3 rounded-sm bg-[#e3ff52]" />
          <div className="w-3 h-3 rounded-sm bg-[#ccfc03]" />
          <div className="w-3 h-3 rounded-sm bg-[#b3e300]" />
          <div className="w-3 h-3 rounded-sm bg-[#8ab600]" />
        </div>        
        <span>Más popular</span>
      </div>
    </div>
  );
}