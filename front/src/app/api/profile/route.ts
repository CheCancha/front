import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    // Obtener datos del usuario
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

    // Obtener reservas del usuario
    const bookings = await db.booking.findMany({
  where: { userId: session.user.id },
  select: {
    id: true,
    date: true,
    startTime: true,
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
  orderBy: { date: "asc" },
});

    const formattedBookings = bookings.map((b) => ({
  id: b.id,
  court: b.court.name,
  complex: b.court.complex.name, 
  date: b.date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
  startTime: b.startTime.toString().padStart(2, "0") + ":00",
  status: b.status,
}));

    return NextResponse.json({ ...user, bookings: formattedBookings });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}
