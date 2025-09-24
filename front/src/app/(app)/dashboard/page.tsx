import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { routes } from "@/routes";

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
      select: { id: true },
    });

    if (complex) {
      redirect(routes.app.dashboard(complex.id));
    }
  }

  redirect(routes.public.home);
}