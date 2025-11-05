"use client";

import React, { useEffect, useState, memo } from "react";
import { format } from "date-fns"; // Corregido: 'format' viene de 'date-fns'
import { DollarSign, BookCheck, Users, BarChart } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { RevenueBarChart } from "./RevenueBarChart";
import { CourtRevenuePieChart } from "./CourtRevenuePieChart";
import { PeakHoursHeatmap } from "./PeakHoursHeatmap";
import { AnalyticsTables } from "./AnalyticsTable";
import type { AnalyticsData } from "@/app/features/dashboard/services/analytics.service";

interface AnalyticsTabProps {
  complexId: string;
  startDate: Date;
  endDate: Date;
  courtIds?: string[];
}

// --- COMPONENTES DE UI (StatCard, formatters) ---
const StatCard = memo(
  ({
    title,
    value,
    icon: Icon,
    change,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    change?: string;
  }) => (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold">{value}</p>
        {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
      </div>
    </div>
  )
);
StatCard.displayName = "StatCard";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatChange = (change: number) => {
  if (change === 0) return "sin cambios";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% vs período anterior`;
};

// --- COMPONENTE DE CARGA ---
const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  </div>
);

// --- COMPONENTE DE PESTAÑA ---
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  complexId,
  startDate,
  endDate,
  courtIds,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    setIsLoading(true);

    // Formateamos las fechas para la URL
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    const courtsQuery = courtIds ? `&courtIds=${courtIds.join(",")}` : "";

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/complex/${complexId}/analytics?startDate=${start}&endDate=${end}${courtsQuery}`
        );
        if (!res.ok) {
          throw new Error("No se pudieron cargar las analíticas.");
        }
        const apiData: AnalyticsData = await res.json();
        setData(apiData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [complexId, startDate, endDate, courtIds]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-red-500">
        Error al cargar los datos de analíticas.
      </div>
    );
  }

  const { kpis, charts, tables } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Balance Neto"
          value={formatCurrency(kpis.totalIncome.value)}
          icon={DollarSign}
          change={formatChange(kpis.totalIncome.change)}
        />
        <StatCard
          title="Reservas"
          value={kpis.totalBookings.value.toString()}
          icon={BookCheck}
          change={formatChange(kpis.totalBookings.change)}
        />
        <StatCard
          title="Clientes Únicos"
          value={kpis.uniqueCustomers.value.toString()}
          icon={Users}
          change={formatChange(kpis.uniqueCustomers.change)}
        />
        <StatCard
          title="Tasa de Ocupación"
          value={`${kpis.occupancyRate.value.toFixed(1)}%`}
          icon={BarChart}
          change={formatChange(kpis.occupancyRate.change)}
        />
      </div>

      {/* --- GRÁFICOS DINÁMICOS --- */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-switzer font-semibold mb-4">
            Evolución de Ingresos
          </h3>
          {charts.lineChartData.length > 0 ? (
            <RevenueBarChart data={charts.lineChartData} />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">No hay datos suficientes.</p>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-switzer font-semibold mb-4">
            Ingresos por Cancha
          </h3>
          {charts.pieChartData.length > 0 ? (
            <CourtRevenuePieChart data={charts.pieChartData} />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">No hay datos suficientes.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col items-center">
        <h3 className="text-lg font-switzer font-semibold mb-4">
          Horarios de Mayor Demanda
        </h3>
        <PeakHoursHeatmap
          data={charts.heatmapData}
          dayLabels={charts.dayLabels}
          hourLabels={charts.hourLabels}
        />
      </div>

      <AnalyticsTables
        topCustomers={tables.topCustomers}
        courtsBreakdown={tables.courtsBreakdown}
      />
    </div>
  );
};
