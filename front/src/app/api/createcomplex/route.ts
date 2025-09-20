import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      address,
      city,
      province,
      openHour,
      closeHour,
      courtCount,
    } = body;

    if (!name || !address || !city || !province) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const complex = await db.complex.create({
      data: {
        name,
        address,
        city,
        province,
        managerId: session.user.id,
        openHour: openHour || 9,
        closeHour: closeHour || 23,
        courtCount: Number(courtCount) || 0,
      },
    });

    return NextResponse.json(complex, { status: 201 });
    
  } catch (error) {
    console.error("Error al crear el complejo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}