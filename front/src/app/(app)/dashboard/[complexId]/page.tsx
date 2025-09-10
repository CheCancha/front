import { MetricCard } from "@/app/features/dashboard/components/MetricCard";
import { SalesChart } from "@/app/features/dashboard/components/SalesChart";
import { Reservations } from "@/app/features/dashboard/components/Reservations";
import { getComplexDataForManager } from "@/app/features/dashboard/services/dashboard.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound, redirect } from "next/navigation";
import { DollarSign, CreditCard, Clock } from "lucide-react";
import { routes } from "@/routes";

// --- PÁGINA PRINCIPAL DEL DASHBOARD (AHORA ES UN SERVER COMPONENT) ---

interface DashboardPageProps {
  params: {
    complexId: string;
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  // Doble chequeo de seguridad: si no hay sesión o no es MANAGER, fuera.
  if (!session || session.user.role !== 'MANAGER') {
    redirect(routes.auth.login);
  }

  // Buscamos los datos del complejo usando el ID de la URL y el ID del usuario de la sesión
  const complexData = await getComplexDataForManager(params.complexId, session.user.id);

  // Si no se encuentran datos (porque el complejo no existe o el usuario no es el dueño),
  // mostramos una página 404.
  if (!complexData) {
    return notFound();
  }

  // Formateamos los ingresos para mostrarlos correctamente
  const formattedIncome = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(complexData.totalIncomeToday / 100); // Asumiendo que guardas los precios en centavos

  return (
    <div className="flex-1 space-y-6 mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-8 space-y-4">
          {/* MÉTRICAS ARRIBA (AHORA CON DATOS REALES) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
            <MetricCard
              title="Reservas de Hoy"
              value={complexData.reservationsToday.toString()}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              change="+5.2%" // Esto puede ser dinámico en el futuro
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
