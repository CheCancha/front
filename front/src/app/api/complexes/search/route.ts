import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(3),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");

    const validation = searchSchema.safeParse({ query });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Query debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    const { query: searchQuery } = validation.data;

    // Buscamos complejos por nombre o ciudad
    const complexes = await db.complex.findMany({
      where: {
        onboardingCompleted: true,
        OR: [
          {
            name: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
          {
            city: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
      },
      take: 5, // Limitamos a 5 resultados
    });

    return NextResponse.json({ complexes });
  } catch (error) {
    console.error("[COMPLEXES_SEARCH_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}