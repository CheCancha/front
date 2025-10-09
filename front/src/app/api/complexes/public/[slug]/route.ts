import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const complex = await db.complex.findUnique({
      where: { slug: slug, onboardingCompleted: true },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        courts: {
          include: {
            priceRules: true,
          },
        },
        schedule: true,
        amenities: true,
      },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    return NextResponse.json(complex);
  } catch (error) {
    console.error("[COMPLEX_SLUG_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
