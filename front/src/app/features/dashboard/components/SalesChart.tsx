"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// --- DATOS DE EJEMPLO (En una app real, vendrían de una API) ---
const weeklyData = {
  week1: [
    { name: "Lun", total: 2390 }, { name: "Mar", total: 1398 }, { name: "Mié", total: 9800 },
    { name: "Jue", total: 3908 }, { name: "Vie", total: 4800 }, { name: "Sáb", total: 3800 }, { name: "Dom", total: 4300 }
  ],
  week2: [
    { name: "Lun", total: 3490 }, { name: "Mar", total: 2398 }, { name: "Mié", total: 7800 },
    { name: "Jue", total: 4908 }, { name: "Vie", total: 5800 }, { name: "Sáb", total: 4800 }, { name: "Dom", total: 5300 }
  ],
  week3: [
    { name: "Lun", total: 1390 }, { name: "Mar", total: 8398 }, { name: "Mié", total: 4800 },
    { name: "Jue", total: 2908 }, { name: "Vie", total: 3800 }, { name: "Sáb", total: 2800 }, { name: "Dom", total: 3300 }
  ],
  week4: [
    { name: "Lun", total: 4390 }, { name: "Mar", total: 3398 }, { name: "Mié", total: 6800 },
    { name: "Jue", total: 5908 }, { name: "Vie", total: 6800 }, { name: "Sáb", total: 5800 }, { name: "Dom", total: 6300 }
  ],
};

// --- COMPONENTE PRINCIPAL ---
export function SalesChart() {
  const [activeWeek, setActiveWeek] = useState<keyof typeof weeklyData>("week1");
  const [dateRange, setDateRange] = useState("Este Mes");

  // Los datos del gráfico cambiarán según la semana activa
  const chartData = weeklyData[activeWeek];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      {/* SECCIÓN 1: CABECERA CON FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
            <h3 className="text-lg font-semibold">Reporte de Ingresos</h3>
            <p className="text-sm text-gray-500">Analiza los ingresos por períodos.</p>
        </div>
        
        {/* Filtro de Rango de Fechas (Trimestre, Semestre, etc.) */}
        <div className="relative">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none cursor-pointer bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Este Mes</option>
            <option>Último Trimestre</option>
            <option>Último Semestre</option>
            <option>Este Año</option>
          </select>
          <ChevronDown className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>
      
      {/* SECCIÓN 2: FILTRO DE SEMANAS */}
      <div className="flex items-center gap-2 mb-6">
        {(Object.keys(weeklyData) as Array<keyof typeof weeklyData>).map((week, index) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer",
              activeWeek === week
                ? "bg-indigo-100 text-indigo-700"
                : "bg-transparent text-gray-600 hover:bg-gray-100"
            )}
          >
            Semana {index + 1}
          </button>
        ))}
      </div>

      {/* SECCIÓN 3: GRÁFICO */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} // Color de fondo al hacer hover
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
            }}
          />
          <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}