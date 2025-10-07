import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";

export async function GET() {
  try {
    const sports = await db.sport.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(sports);
  } catch (error) {
    console.error("[SPORTS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
