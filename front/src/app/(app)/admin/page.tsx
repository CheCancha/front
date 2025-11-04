import { db } from "@/shared/lib/db";
import InscriptionRequests from "./InscriptionRequests";
import AdminDashboard from "./AdminDashboard";
import { ComplexWithManager } from "@/shared/entities/complex/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../shared/components/ui/tabs";
import { FileText, Building, Users } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const pendingRequests = await db.inscriptionRequest.findMany({
    where: { status: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
  });

  const activeComplexesRaw = await db.complex.findMany({
    include: {
      manager: {
        select: { id: true, name: true, phone: true, email: true },
      },
      _count: {
        select: { courts: true },
      },
      schedule: true,
      inscriptionRequest: true,
    },
    orderBy: { name: "asc" },
  });

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
          id: c.manager?.id,
          name: c.manager?.name || null,
          phone: c.manager?.phone || null,
          email: c.manager?.email || null,
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark">
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
            <div className="bg-[#f8f9f9] p-6 rounded-lg border">
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