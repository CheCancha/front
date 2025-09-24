import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { BookingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    });

    const bookings = await db.booking.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        date: true,
        startTime: true,
        startMinute: true,
        status: true,
        court: {
          select: {
            name: true,
            complex: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 10,
    });

    const now = new Date();

    const formattedBookings = bookings.map((b) => {
      // ---> [CAMBIO] Lógica para determinar el estado correcto
      const bookingDateTime = new Date(b.date);
      bookingDateTime.setHours(b.startTime, b.startMinute || 0, 0, 0);

      let displayStatus: BookingStatus | "VENCIDO" = b.status;
      if (b.status === "PENDIENTE" && bookingDateTime < now) {
        displayStatus = "VENCIDO";
      }

      return {
        id: b.id,
        court: b.court.name,
        complex: b.court.complex.name,
        date: b.date.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        // ---> [CAMBIO] Formato de hora corregido
        startTime: `${b.startTime.toString().padStart(2, "0")}:${(
          b.startMinute || 0
        )
          .toString()
          .padStart(2, "0")}`,
        status: displayStatus,
      };
    });

    return NextResponse.json({ ...user, bookings: formattedBookings });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}
