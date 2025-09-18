import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const complexes = await db.complex.findMany({
      where: {
        onboardingCompleted: true, 
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        province: true,
        images: {
          where: { isPrimary: true }, 
          take: 1,
        },
        courts: {
          select: {
            pricePerHour: true,
          },
          orderBy: {
            pricePerHour: "asc", 
          },
          take: 1,
        },
      },
    });

    // Mapeamos los resultados para darles un formato más amigable para el frontend
    const formattedComplexes = complexes.map((complex) => ({
      id: complex.id,
      name: complex.name,
      address: `${complex.address}, ${complex.city}`,
      imageUrl: complex.images[0]?.url || "/placeholder.jpg",
      priceFrom: complex.courts[0]?.pricePerHour || 0, 
    }));

    return NextResponse.json(formattedComplexes);
  } catch (error) {
    console.error("[COMPLEXES_PUBLIC_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
