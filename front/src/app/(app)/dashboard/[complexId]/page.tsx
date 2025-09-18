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

// --- PÁGINA PRINCIPAL DEL DASHBOARD (AHORA ES UN SERVER COMPONENT) ---

// 1. Definimos una interfaz clara y correcta para las props de la página.
//    Next.js ya resuelve los parámetros por ti en los Server Components.
interface DashboardPageProps {
  params: Promise<{ complexId: string }>;
}

// 2. Usamos la interfaz que definimos en la firma de la función.
//    Esto hace el código más limpio y evita errores de tipado.
export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "MANAGER") {
    redirect(routes.auth.ingreso);
  }

  const { complexId } = await params;

  const complexData = await getComplexDataForManager(
    complexId,
    session.user.id
  );

  if (!complexData) {
    return notFound();
  }

  // Formateamos los ingresos para mostrarlos correctamente
  const formattedIncome = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(complexData.totalIncomeToday / 100);

  return (
    <div className="flex-1 space-y-6 mx-auto">
      {!complexData.onboardingCompleted && (
        <OnboardingPrompt complexId={complexId} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-8 space-y-4">
          {/* MÉTRICAS ARRIBA (AHORA CON DATOS REALES) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
            <MetricCard
              title="Reservas de Hoy"
              value={complexData.reservationsToday.toString()}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              change="+5.2%"
              changeType="increase"
              description="Comparado con ayer"
            />
            <MetricCard
              title="Ocupación"
              value="76%" // TODO: Calcular ocupación real
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
              change="+12.1%"
              changeType="increase"
              description="Sobre las horas disponibles"
            />
            <MetricCard
              title="Ingresos del Día"
              value={formattedIncome}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              change="+20.4%"
              changeType="increase"
              description="Comparado con ayer"
            />
          </div>
          {/* GRÁFICO ABAJO */}
          <SalesChart />
        </div>
        {/* COLUMNA DERECHA (ASIDE CON TURNOS) */}
        <div className="lg:col-span-4">
          <Reservations />
        </div>
      </div>
    </div>
  );
}
