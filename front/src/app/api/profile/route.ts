import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        image: true,
        bookings: {
          orderBy: {
            date: "desc",
          },
          take: 10,
          include: {
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
        },
      },
    });

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 });
    }

    const formattedBookings = user.bookings.map((booking) => ({
      id: booking.id,
      complex: booking.court.complex.name,
      court: booking.court.name,
      date: format(booking.date, "eeee dd 'de' MMMM, yyyy", { locale: es }),
      startTime: `${String(booking.startTime).padStart(2, "0")}:${String(
        booking.startMinute || 0
      ).padStart(2, "0")}`,
      status: booking.status,
    }));

    return NextResponse.json({
      phone: user.phone,
      image: user.image,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
