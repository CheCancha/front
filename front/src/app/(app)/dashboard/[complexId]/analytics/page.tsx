import { DollarSign, BookCheck, Users, BarChart } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change }: { title: string, value: string, icon: React.ElementType, change?: string }) => (
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

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* --- Encabezado --- */}
            <header>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analíticas</h1>
                <p className="text-gray-600 mt-1">Visualiza el rendimiento de tu club a lo largo del tiempo.</p>
            </header>

            {/* --- Grilla de Estadísticas --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Ingresos Totales (Mes)" value="$1.250.000" icon={DollarSign} change="+15.2% vs mes anterior" />
                <StatCard title="Reservas (Mes)" value="184" icon={BookCheck} change="+5% vs mes anterior" />
                <StatCard title="Clientes recurrentes" value="45" icon={Users} change="+3 nuevos este mes" />
                <StatCard title="Tasa de Ocupación (Mes)" value="78%" icon={BarChart} change="-1.5% vs mes anterior" />
            </div>

            {/* --- Placeholder para Gráficos --- */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Ingresos por Deporte</h3>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-gray-500">Aquí irá un gráfico de barras</p>
                </div>
            </div>
        </div>
    );
}