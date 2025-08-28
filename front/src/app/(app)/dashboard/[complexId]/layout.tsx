import Navbar from "@/shared/components/Navbar"; 
import DashboardNavTabs from "@/app/features/dashboard/components/NavTab";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const managerName = "Admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            ¡Bienvenido, {managerName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Estos son los resultados de las estadísticas de esta semana.
          </p>
        </header>

        <DashboardNavTabs />

        <main className="mt-6">
          {children}
        </main>
      </div>
    </div>
  );
}