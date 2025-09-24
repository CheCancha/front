"use client";

import React, { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChevronDown, Frown } from "lucide-react";
import { format, startOfMonth, endOfMonth, subQuarters, startOfYear, endOfYear } from 'date-fns';

// --- TIPOS ---
type ChartData = {
  name: string;
  total: number;
};

// --- COMPONENTES AUXILIARES ---
const SalesChartSkeleton = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
        <div className="flex justify-between mb-4">
            <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
        </div>
        <div className="h-[350px] bg-gray-100 rounded-lg"></div>
    </div>
);

const NoDataMessage = () => (
    <div className="h-[350px] flex flex-col items-center justify-center text-center text-gray-500">
        <Frown className="h-12 w-12 mb-2" />
        <h4 className="font-semibold">No hay datos de ingresos</h4>
        <p className="text-sm">No se encontraron ventas para el período seleccionado.</p>
    </div>
);


// --- COMPONENTE PRINCIPAL ---
export function SalesChart({ complexId }: { complexId: string }) {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState("Este Mes");

    useEffect(() => {
        if (!complexId) {
            setIsLoading(false);
            setError("ID del complejo no proporcionado.");
            return;
        }

        const getDatesFromRange = () => {
            const now = new Date();
            switch (dateRange) {
                case "Último Trimestre":
                    return {
                        start: format(startOfMonth(subQuarters(now, 1)), 'yyyy-MM-dd'),
                        end: format(endOfMonth(subQuarters(now, 1)), 'yyyy-MM-dd') 
                    };
                case "Este Año":
                     return {
                        start: format(startOfYear(now), 'yyyy-MM-dd'),
                        end: format(endOfYear(now), 'yyyy-MM-dd')
                    };
                case "Este Mes":
                default:
                    return {
                        start: format(startOfMonth(now), 'yyyy-MM-dd'),
                        end: format(endOfMonth(now), 'yyyy-MM-dd')
                    };
            }
        };

        const fetchSalesData = async () => {
            setIsLoading(true);
            setError(null);
            
            const { start, end } = getDatesFromRange();
            
            try {
                const res = await fetch(`/api/complex/${complexId}/financials?startDate=${start}&endDate=${end}`);
                if (!res.ok) {
                    throw new Error("No se pudo cargar el reporte de ingresos.");
                }
                const data: ChartData[] = await res.json();
                setChartData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSalesData();
    }, [complexId, dateRange]);


    if (isLoading) {
        return <SalesChartSkeleton />;
    }
    
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-lg font-semibold">Reporte de Ingresos</h3>
                    <p className="text-sm text-gray-500">Analiza los ingresos por períodos.</p>
                </div>
                
                <div className="relative">
                    <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="appearance-none cursor-pointer bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option>Este Mes</option>
                        <option>Último Trimestre</option>
                        <option>Este Año</option>
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </div>
            
            {error ? (
                <div className="text-red-500 text-center py-10">{error}</div>
            ) : chartData.length > 0 ? (
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
                            cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.75rem',
                            }}
                        />
                        <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <NoDataMessage />
            )}
        </div>
    );
}