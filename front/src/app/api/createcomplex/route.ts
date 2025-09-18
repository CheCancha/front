// front/src/app/api/createcomplex/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(req: Request) {
  try {
    // 1. Verificar autenticación del usuario
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    // 2. Verificar que el rol del usuario sea MANAGER
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "No tienes permisos para crear complejos" }, { status: 403 });
    }

    // 3. Obtener los datos del cuerpo de la solicitud
    const body = await req.json();
    const {
      name,
      address,
      city,
      province,
      openHour,
      closeHour,
      courtCount,
      slotDurationMinutes,
    } = body;

    // 4. Validar campos obligatorios
    if (!name || !address || !city || !province) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: name, address, city y province" },
        { status: 400 }
      );
    }

    // 5. Crear el complejo en la base de datos
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
        slotDurationMinutes: Number(slotDurationMinutes) || 60,
      },
    });

    return NextResponse.json(complex, { status: 201 });
    
  } catch (error) {
    console.error("Error al crear el complejo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}