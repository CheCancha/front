import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { routes } from "@/routes";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ redirectUrl: routes.public.home });
  }

  const { user } = session;
  let redirectUrl = routes.public.home; 

  try {
    if (user.role === "ADMIN") {
      redirectUrl = routes.app.admin;
    } else if (user.role === "MANAGER") {
      const complex = await db.complex.findUnique({
        where: { managerId: user.id },
        select: { id: true },
      });

      if (complex) {
        redirectUrl = routes.app.dashboard(complex.id);
      } else {
        redirectUrl = routes.public.home; 
      }
    }

    return NextResponse.json({ redirectUrl });

  } catch (error) {
    console.error("Error determinando la redirección post-login:", error);
    return NextResponse.json({ redirectUrl: routes.public.home });
  }
}

