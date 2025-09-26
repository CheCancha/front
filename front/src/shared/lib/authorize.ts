import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";

export async function authorizeAndVerify(complexId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return { error: new NextResponse("No autorizado", { status: 401 }) };
  }

  const complex = await db.complex.findFirst({
    where: { id: complexId, managerId: session.user.id },
  });

  if (!complex) {
    return { error: new NextResponse("Complejo no encontrado", { status: 404 }) };
  }

  return { session, complex };
}
