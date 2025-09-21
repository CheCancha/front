import { db } from "@/shared/lib/db";
import InscriptionRequests from "./InscriptionRequests";
import AdminDashboard from "./AdminDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { FileText, Building, Users } from "lucide-react"; 

export default async function AdminPage() {
  // --- La lógica para obtener los datos no cambia ---
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
    // ✨ 2. MEJORAMOS EL LAYOUT GENERAL
    <div className="min-h-screen bg-gray-50/50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- Header Mejorado --- */}
        <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Panel de Administración
            </h1>
            <p className="mt-1 text-gray-600">
                Gestiona las solicitudes de inscripción, complejos activos y usuarios de la plataforma.
            </p>
        </header>

        {/* --- Tabs con Diseño Mejorado --- */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 sm:w-max">
            <TabsTrigger value="requests">
              <FileText className="w-4 h-4 mr-2" />
              Solicitudes ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="complexes">
              <Building className="w-4 h-4 mr-2" />
              Complejos ({activeComplexes.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          {/* --- Contenido de las Pestañas --- */}
          <TabsContent value="requests" className="mt-6">
            <InscriptionRequests initialRequests={pendingRequests} />
          </TabsContent>

          <TabsContent value="complexes" className="mt-6">
            <AdminDashboard complexes={activeComplexes} />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
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