import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { notFound, redirect } from "next/navigation";
import {
  DollarSign,
  Clock,
  BarChart,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";
import { routes } from "@/routes";
import { getComplexDataForManager } from "@/app/features/dashboard/services/dashboard.service";
import { MetricCard } from "@/app/features/dashboard/components/MetricCard";
import { SalesChart } from "@/app/features/dashboard/components/SalesChart";
import { Reservations } from "@/app/features/dashboard/components/Reservations";
import { OnboardingPrompt } from "@/app/features/dashboard/components/OnboardingPrompt";
import { formatCurrency } from "@/shared/helper/formatCurrency";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ complexId: string }>;
}) {
  const { complexId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "MANAGER") {
    redirect(routes.auth.ingreso);
  }

  const complexData = await getComplexDataForManager(
    complexId,
    session.user.id
  );

  if (!complexData) {
    return notFound();
  }

  return (
    <div className="flex-1 space-y-6 mx-auto">
      {!complexData.onboardingCompleted && (
        <OnboardingPrompt complexId={complexId} />
      )}

      {/* --- SECCIÓN DE KPIs --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Reservas de Hoy"
          value={complexData.reservationsToday.toString()}
          icon={<Clock />}
        />
        <MetricCard
          title="Ingresos del Día"
          value={formatCurrency(complexData.netIncomeToday)}
          icon={<DollarSign />}
        />
        <MetricCard
          title="Ocupación de Hoy"
          value={`${complexData.occupancyRate}%`}
          icon={<BarChart />}
        />
        <MetricCard
          title="Turnos Próx. 7 Días"
          value={complexData.reservationsNext7Days.toString()}
          icon={<Users />}
        />
        <MetricCard
          title="Ingresos a Confirmar"
          value={formatCurrency(complexData.pendingIncomeNext7Days)}
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Calificación"
          value={`${complexData.averageRating.toFixed(1)} (${
            complexData.reviewCount
          })`}
          icon={<Star />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <SalesChart complexId={complexId} />
        </div>
        <div className="lg:col-span-4">
          {/* Pasamos los datos como prop */}
          <Reservations complexId={complexId} />
        </div>
      </div>
    </div>
  );
}
