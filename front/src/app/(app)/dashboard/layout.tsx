import Link from "next/link";
// Suponiendo que 'usePathname' se usa para la pestaña activa
// import { usePathname } from 'next/navigation'; 

// Componente de navegación que creamos antes
const DashboardNavTabs = () => {
  // const pathname = usePathname(); // Así obtendrías la ruta actual
  const activeTab = "Dashboard"; // Por ahora lo dejamos fijo

  const tabs = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Reservas", href: "/dashboard/reservas" },
    { name: "Clientes", href: "/dashboard/clientes" },
    { name: "Analíticas", href: "/dashboard/analiticas" },
    { name: "Ajustes", href: "/dashboard/ajustes" },
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex items-center space-x-6">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`pb-3 text-sm font-medium transition-colors
              ${
                activeTab === tab.name
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-800"
              }
            `}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const managerName = "Admin";

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 lg:px-32 mx-auto">
      {/* Saludo de bienvenida */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          ¡Bienvenido, {managerName}!
        </h2>
        <p className="text-muted-foreground mt-1">
          Estos son los resultados de las estadísticas de esta semana.
        </p>
      </div>

      {/* Barra de navegación de Tabs */}
      <DashboardNavTabs />

      {/* Aquí es donde Next.js renderizará el componente de cada página */}
      <main className="mt-6">
        {children}
      </main>
    </div>
  );
}