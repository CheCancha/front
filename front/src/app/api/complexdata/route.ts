import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const userWithComplex = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedComplex: {
          select: {
            id: true,
            name: true,
            mp_connected_at: true,
          },
        },
      },
    });

    if (!userWithComplex?.managedComplex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    return NextResponse.json(userWithComplex.managedComplex);
  } catch (error) {
    console.error("[COMPLEX_ME_GET]", error);
    return new NextResponse("Error Interno", { status: 500 });
  }
}
