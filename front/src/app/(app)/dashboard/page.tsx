import { MetricCard } from "@/app/features/dashboard/components/MetricCard";
import { SalesChart } from "@/app/features/dashboard/components/SalesChart";
import { Reservations } from "@/app/features/dashboard/components/Reservations";
import { DollarSign, CreditCard, Clock } from "lucide-react";
import Link from "next/link"; // Importamos Link para la navegación

// --- COMPONENTE DE NAVEGACIÓN POR TABS ---
const DashboardNavTabs = () => {
  const activeTab = "Dashboard";
  const tabs = ["Dashboard", "Reservas", "Clientes", "Analíticas", "Ajustes"];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex items-center space-x-6">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href="#" // Aquí irían las rutas reales, ej: "/dashboard/analytics"
            className={`pb-3 text-sm font-medium transition-colors
              ${
                activeTab === tab
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-800"
              }
            `}
          >
            {tab}
          </Link>
        ))}
      </div>
    </nav>
  );
};

// --- PÁGINA PRINCIPAL DEL DASHBOARD ---
export default function DashboardPage() {
  const managerName = "Admin";

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 lg:px-32 mx-auto">
      {/* SECCIÓN 1: NUEVO ENCABEZADO CON TABS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            ¡Bienvenido, {managerName}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Estos son los resultados de las estadísticas de esta semana.
          </p>
        </div>
      </div>
      
      {/* Se añade el componente de navegación justo debajo del saludo */}
      <DashboardNavTabs />

      {/* SECCIÓN 2: CONTENIDO DEL DASHBOARD (SIN CAMBIOS) */}
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