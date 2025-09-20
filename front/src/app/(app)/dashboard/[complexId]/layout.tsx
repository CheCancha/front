import DashboardNavTabs from "@/app/features/dashboard/components/NavTab";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { notFound } from "next/navigation";

export default async function DashboardComplexLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ complexId: string }>; 
}) {
  // Await params antes de usarlo
  const { complexId } = await params;
  const session = await getServerSession(authOptions);

  // Buscamos el nombre del complejo 
  const complex = await db.complex.findUnique({
    where: {
      id: complexId,
      managerId: session?.user?.id, 
    },
    select: {
      name: true,
    },
  });

  if (!complex) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Panel de {complex.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Gestioná las reservas, canchas y horarios de tu complejo.
        </p>
      </header>

      <DashboardNavTabs />

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}