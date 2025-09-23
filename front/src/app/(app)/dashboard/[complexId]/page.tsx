import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { notFound, redirect } from "next/navigation";
import { DollarSign, CreditCard, Clock } from "lucide-react";
import { routes } from "@/routes";
import { getComplexDataForManager } from "@/app/features/dashboard/services/dashboard.service";
import { MetricCard } from "@/app/features/dashboard/components/MetricCard";
import { SalesChart } from "@/app/features/dashboard/components/SalesChart";
import { Reservations } from "@/app/features/dashboard/components/Reservations";
import { OnboardingPrompt } from "@/app/features/dashboard/components/OnboardingPrompt";

// 👇 Usamos directamente PageProps genérico de Next.js
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ complexId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { complexId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

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

  const formattedIncome = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(complexData.totalIncomeToday);

  return (
    <div className="flex-1 space-y-6 mx-auto">
      {!complexData.onboardingCompleted && (
        <OnboardingPrompt complexId={complexId} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
            <MetricCard
              title="Reservas de Hoy"
              value={complexData.reservationsToday.toString()}
              icon={<Clock className="h-4 w-4 text-gray-500" />}
              description="Total de turnos del día"
            />
            <MetricCard
              title="Ocupación de Hoy"
              value={`${complexData.occupancyRate}%`}
              icon={<CreditCard className="h-4 w-4 text-gray-500" />}
              description="Sobre las horas disponibles"
            />
            <MetricCard
              title="Ingresos del Día"
              value={formattedIncome}
              icon={<DollarSign className="h-4 w-4 text-gray-500" />}
              description="Ingresos confirmados"
            />
          </div>
          <SalesChart complexId={complexId} />
        </div>
        <div className="lg:col-span-4">
          <Reservations complexId={complexId} />
        </div>
      </div>
    </div>
  );
}
