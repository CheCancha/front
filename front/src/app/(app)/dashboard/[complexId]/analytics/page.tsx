import { DollarSign, BookCheck, Users, BarChart } from "lucide-react";
import { getAnalyticsData } from "@/app/features/dashboard/services/analytics.service";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";
import { AnalyticsFilters } from "@/app/features/dashboard/components/analytics/AnalyticsFilters";
import { RevenueLineChart } from "@/app/features/dashboard/components/analytics/RevenueLineChart";
import { CourtRevenuePieChart } from "@/app/features/dashboard/components/analytics/CourtRevenuePieChart";
import { PeakHoursHeatmap } from "@/app/features/dashboard/components/analytics/PeakHoursHeatmap";
import { AnalyticsTables } from "@/app/features/dashboard/components/analytics/AnalyticsTable";

export const dynamic = "force-dynamic";

const StatCard = ({
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
);

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

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ complexId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const from = resolvedSearchParams.from
    ? parseISO(resolvedSearchParams.from as string)
    : startOfMonth(new Date());
  const to = resolvedSearchParams.to
    ? parseISO(resolvedSearchParams.to as string)
    : endOfMonth(new Date());
  const courtIds = resolvedSearchParams.courtIds
    ? (resolvedSearchParams.courtIds as string).split(",")
    : undefined;

  const data = await getAnalyticsData({
    complexId: resolvedParams.complexId,
    startDate: from,
    endDate: to,
    courtIds: courtIds,
  });

  const { kpis, charts, tables, filters } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Analíticas
        </h1>
        <p className="text-gray-600 mt-1">
          Visualiza el rendimiento de tu club a lo largo del tiempo.
        </p>
      </header>

      <AnalyticsFilters availableCourts={filters.availableCourts} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos Totales"
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
          <h3 className="text-lg font-semibold mb-4">Evolución de Ingresos</h3>
          {charts.lineChartData.length > 0 ? (
            <RevenueLineChart data={charts.lineChartData} />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">
                No hay datos suficientes para mostrar.
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Ingresos por Cancha</h3>
          {charts.pieChartData.length > 0 ? (
            <CourtRevenuePieChart data={charts.pieChartData} />
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">
                No hay datos suficientes para mostrar.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
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
}
