// front/src/app/(app)/dashboard/page.tsx

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { routes } from "@/routes";

// Esta página actúa como el ÚNICO "distribuidor" inteligente.
export default async function DashboardEntryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(routes.public.home);
  }

  const { user } = session;

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role === "MANAGER") {
    const complex = await db.complex.findUnique({
      where: { managerId: user.id },
      select: { id: true }, // Ya no necesitamos 'onboardingCompleted' aquí
    });

    // Si el manager TIENE un complejo, lo mandamos a su dashboard, sin importar el estado del onboarding.
    if (complex) {
      redirect(routes.app.dashboard(complex.id));
    }
  }

  redirect(routes.public.home);
}