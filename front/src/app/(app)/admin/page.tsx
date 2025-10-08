import { db } from "@/shared/lib/db";
import InscriptionRequests from "./InscriptionRequests";
import AdminDashboard from "./AdminDashboard";
import { ComplexWithManager } from "@/shared/entities/complex/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/Tabs";
import { FileText, Building, Users } from "lucide-react";

// Con esta línea, forzamos a Next.js a que esta página sea siempre dinámica
// y no utilice caché para los datos que obtiene.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // 1. Obtenemos las solicitudes pendientes.
  const pendingRequests = await db.inscriptionRequest.findMany({
    where: { status: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
  });

  // 2. Obtenemos los complejos con datos adicionales.
  const activeComplexesRaw = await db.complex.findMany({
    include: {
      manager: {
        select: { name: true, phone: true },
      },
      _count: {
        select: { courts: true },
      },
      schedule: true,
      inscriptionRequest: true, // Incluimos la solicitud original
    },
    orderBy: { name: "asc" },
  });

  // 3. Mapeamos los datos de los complejos.
  const activeComplexes: ComplexWithManager[] = activeComplexesRaw.map(
    (c): ComplexWithManager => {
      const hasCourts = c._count.courts > 0;
      const hasSchedule = !!c.schedule;
      const hasPaymentInfo = !!c.mp_access_token;
      const isOnboardingFullyCompleted = hasCourts && hasSchedule && hasPaymentInfo;

      return {
        id: c.id,
        name: c.name,
        manager: {
          name: c.manager?.name || null,
          phone: c.manager?.phone || null,
        },
        subscriptionPlan: c.subscriptionPlan,
        subscriptionStatus: c.subscriptionStatus,
        subscriptionCycle: c.subscriptionCycle,
        trialEndsAt: c.trialEndsAt,
        subscribedAt: c.subscribedAt || c.inscriptionRequest?.createdAt || null,
        onboardingCompleted: isOnboardingFullyCompleted,
        hasCourts,
        hasSchedule,
        hasPaymentInfo,
      };
    }
  );

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Panel de Administración
          </h1>
          <p className="mt-1 text-gray-600">
            Gestiona las solicitudes de inscripción, complejos activos y
            usuarios de la plataforma.
          </p>
        </header>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="w-full h-auto flex-col sm:h-10 sm:w-auto sm:flex-row bg-[#f8f8f9] border">
            <TabsTrigger value="requests" className="w-full justify-center sm:w-auto">
              <FileText className="w-4 h-4 mr-2" />
              Solicitudes ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="complexes" className="w-full justify-center sm:w-auto">
              <Building className="w-4 h-4 mr-2" />
              Complejos ({activeComplexes.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="w-full justify-center sm:w-auto">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <InscriptionRequests initialRequests={pendingRequests} />
          </TabsContent>

          <TabsContent value="complexes" className="mt-6">
            <AdminDashboard complexes={activeComplexes} />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="bg-[#f8f8f9] p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">
                Gestión de Usuarios
              </h2>
              <p className="text-gray-500">
                Próximamente: Aquí podrás ver y gestionar todos los usuarios
                registrados en la plataforma.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}