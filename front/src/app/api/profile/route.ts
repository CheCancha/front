import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { BookingStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const userWithBookings = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        image: true,
        bookings: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            startTime: true,
            startMinute: true,
            status: true,
            hasReview: true, 
            court: {
              select: {
                name: true,
                slotDurationMinutes: true,
                complex: {
                  select: { 
                  id: true,    
                  name: true,
                  cancellationPolicyHours: true, 
                },
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
    
    const complexCounts = bookings.reduce((acc, b) => {
      const complexName = b.court.complex.name;
      acc[complexName] = (acc[complexName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteComplex =
      Object.keys(complexCounts).sort(
        (a, b) => complexCounts[b] - complexCounts[a]
      )[0] || null;

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      complex: booking.court.complex.name,
      complexId: booking.court.complex.id, 
      court: booking.court.name,
      date: booking.date.toISOString(),
      startTime: `${String(booking.startTime).padStart(2, "0")}:${String(
        booking.startMinute || 0
      ).padStart(2, "0")}`,
      status: booking.status,
      hasReview: booking.hasReview,
      cancellationPolicyHours: booking.court.complex.cancellationPolicyHours,
    }));

    return NextResponse.json({
      phone: userWithBookings.phone,
      image: userWithBookings.image,
      stats: {
        totalBookings,
        completedBookings: completedBookingsCount,
        hoursPlayed,
        favoriteComplex,
      },
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
