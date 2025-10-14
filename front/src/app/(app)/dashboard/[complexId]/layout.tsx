import DashboardNavTabs from "@/app/features/dashboard/components/NavTab";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { notFound } from "next/navigation";
import { ProFeaturePaywall } from "@/app/features/dashboard/components/ProFeature";
import { headers } from "next/headers";

export default async function DashboardComplexLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ complexId: string }>;
}) {
  const { complexId } = await params;
  const session = await getServerSession(authOptions);

  const complex = await db.complex.findUnique({
    where: {
      id: complexId,
      managerId: session?.user?.id,
    },
    select: {
      name: true,
      slug: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  if (!complex) {
    return notFound();
  }

  const pathname = (await headers()).get("next-url") || "";
  const isProOrTrial =
    complex.subscriptionPlan === "FULL" ||
    complex.subscriptionStatus === "EN_PRUEBA";

  const proRoutes = [
    `/dashboard/${complexId}/analytics`,
    `/dashboard/${complexId}/marketing`,
    `/dashboard/${complexId}/customers`,
  ];

  const isAccessingProRoute = proRoutes.some((route) =>
    pathname.startsWith(route)
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark">
          Panel de {complex.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Gestioná las reservas, canchas y horarios de tu complejo.
        </p>
      </header>

      <DashboardNavTabs
        subscriptionPlan={complex.subscriptionPlan}
        subscriptionStatus={complex.subscriptionStatus}
      />

      <div className="mt-6">
        {isAccessingProRoute && !isProOrTrial ? (
          <ProFeaturePaywall
            complexId={complexId}
            featureName="Funcionalidad Pro"
            description="Mejorá tu plan para acceder a herramientas avanzadas de marketing, analíticas y clientes, que te ayudarán a hacer crecer tu negocio."
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
