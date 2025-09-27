import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookingStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Hacemos una única consulta para traer todos los datos necesarios
    const userWithBookings = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        image: true,
        bookings: {
          orderBy: { date: "desc" },
          include: {
            court: {
              select: {
                name: true,
                slotDurationMinutes: true, // Necesitamos la duración para las horas jugadas
                complex: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithBookings) {
      return new NextResponse("Usuario no encontrado", { status: 404 });
    }

    // --- CÁLCULO DE ESTADÍSTICAS (KPIs) ---
    const { bookings } = userWithBookings;
    const totalBookings = bookings.length;

    const completedBookings = bookings.filter(
      (b) => b.status === BookingStatus.COMPLETADO
    );
    const completedBookingsCount = completedBookings.length;

    const minutesPlayed = completedBookings.reduce(
      (acc, b) => acc + b.court.slotDurationMinutes,
      0
    );
    const hoursPlayed = Math.floor(minutesPlayed / 60);

    // Encontrar el complejo favorito
    const complexCounts = bookings.reduce((acc, b) => {
      const complexName = b.court.complex.name;
      acc[complexName] = (acc[complexName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteComplex =
      Object.keys(complexCounts).sort(
        (a, b) => complexCounts[b] - complexCounts[a]
      )[0] || null;

    // Formateamos solo las últimas 10 para la lista inicial
    const formattedBookings = bookings.slice(0, 10).map((booking) => ({
      id: booking.id,
      complex: booking.court.complex.name,
      court: booking.court.name,
      // Usamos toISOString para poder comparar fechas fácilmente en el frontend
      date: booking.date.toISOString(),
      startTime: `${String(booking.startTime).padStart(2, "0")}:${String(
        booking.startMinute || 0
      ).padStart(2, "0")}`,
      status: booking.status,
    }));

    return NextResponse.json({
      phone: userWithBookings.phone,
      image: userWithBookings.image,
      // Nuevas estadísticas
      stats: {
        totalBookings,
        completedBookings: completedBookingsCount,
        hoursPlayed,
        favoriteComplex,
      },
      // Lista de reservas
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
