import { db } from "@/lib/db";
import InscriptionRequests from "./InscriptionRequests";
import AdminDashboard from "./AdminDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";

export default async function AdminPage() {
  const pendingRequests = await db.inscriptionRequest.findMany({
    where: { status: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
  });

  const activeComplexes = await db.complex.findMany({
    where: { onboardingCompleted: true },
    include: {
      manager: {
        select: { name: true, phone: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

        {/* Usamos el nuevo componente de Tabs para una mejor estructura */}
        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">
              Solicitudes Pendientes ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="complexes">
              Complejos Activos ({activeComplexes.length})
            </TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          {/* Contenido de la Pestaña de Solicitudes */}
          <TabsContent value="requests">
            <InscriptionRequests initialRequests={pendingRequests} />
          </TabsContent>

          {/* Contenido de la Pestaña de Complejos */}
          <TabsContent value="complexes">
            <AdminDashboard complexes={activeComplexes} />
          </TabsContent>
          
          {/* Contenido de la Pestaña de Usuarios */}
          <TabsContent value="users">
             <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Gestión de Usuarios</h2>
                <p className="text-gray-500">Próximamente: Aquí podrás ver y gestionar todos los usuarios registrados en la plataforma.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

