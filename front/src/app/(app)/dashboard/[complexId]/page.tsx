import { MetricCard } from "@/app/features/dashboard/components/MetricCard";
import { SalesChart } from "@/app/features/dashboard/components/SalesChart";
import { Reservations } from "@/app/features/dashboard/components/Reservations";
import { DollarSign, CreditCard, Clock } from "lucide-react";

// --- PÁGINA PRINCIPAL DEL DASHBOARD ---
export default function DashboardPage() {

  return (
    <div className="flex-1 space-y-6 mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-8 space-y-4">
          {/* MÉTRICAS ARRIBA */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
            <MetricCard
              title="Reservas de Hoy"
              value="42"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              change="+5.2%"
              changeType="increase"
              description="Comparado con ayer"
            />
            <MetricCard
              title="Ocupación"
              value="76%"
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
              change="+12.1%"
              changeType="increase"
              description="Sobre las horas disponibles"
            />
            <MetricCard
              title="Ingresos del Día"
              value="$1,250.00"
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