// front\src\app\api\bookings\cleanup\route.ts

import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { subMinutes } from "date-fns";
import { BookingStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // 1. Proteger la ruta con un "secret"
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Definir el límite de tiempo (reservas más viejas que esto serán canceladas)
    const fiveMinutesAgo = subMinutes(new Date(), 5);

    // 3. Buscar y actualizar las reservas pendientes expiradas en un solo paso
    const { count } = await db.booking.updateMany({
      where: {
        status: BookingStatus.PENDIENTE,
        createdAt: {
          lt: fiveMinutesAgo, 
        },
      },
      data: {
        status: BookingStatus.CANCELADO,
      },
    });

    console.log(`🧹 Tarea de limpieza ejecutada: ${count} reservas canceladas.`);
    return NextResponse.json({
      ok: true,
      message: `Limpieza completada. ${count} reservas canceladas.`,
    });
  } catch (error) {
    console.error("💥 ERROR en la tarea de limpieza de reservas:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}