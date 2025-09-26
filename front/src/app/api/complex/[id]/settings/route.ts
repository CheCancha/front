import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const complex = await db.complex.findFirst({
      where: { id: id, managerId: session.user.id },
      include: {
        schedule: true,
        courts: {
          orderBy: { name: "asc" },
          include: {
            sport: true,
            priceRules: { orderBy: { startTime: "asc" } },
          },
        },
        images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    return NextResponse.json(complex);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
