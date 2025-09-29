import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function PUT(
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
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado o sin permisos", {
        status: 404,
      });
    }

    const body = await req.json();
    const { amenityIds } = body as { amenityIds: string[] };

    if (!Array.isArray(amenityIds)) {
      return new NextResponse("Formato de datos inválido", { status: 400 });
    }

    await db.complex.update({
      where: { id: id },
      data: {
        amenities: {
          set: amenityIds.map((amenityId) => ({ id: amenityId })),
        },
      },
    });

    return NextResponse.json({ message: "Comodidades actualizadas con éxito" });
  } catch (error) {
    console.error("[SETTINGS_AMENITIES_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
