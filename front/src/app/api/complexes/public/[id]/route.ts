import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; 

    const complex = await db.complex.findUnique({
      where: {
        id: id,
        onboardingCompleted: true, 
      },
      include: {
        images: {
          orderBy: {
            isPrimary: "desc", 
          },
        },
        courts: true,
        schedule: true,
      },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    return NextResponse.json(complex);
  } catch (error) {
    console.error("[COMPLEX_PUBLIC_GET_BY_ID]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
