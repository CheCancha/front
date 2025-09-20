import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("date");

    if (!dateString) {
      return new NextResponse("El parámetro 'date' es obligatorio", {
        status: 400,
      });
    }

    const requestedDate = new Date(`${dateString}T00:00:00.000-03:00`);

    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: id },
        date: requestedDate,
      },
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("[COMPLEX_BOOKINGS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { courtId, guestName, date, time } = body;

    if (!courtId || !guestName || !date || !time) {
      return new NextResponse("Faltan datos para crear la reserva", {
        status: 400,
      });
    }

    const [hour, minute] = time.split(":").map(Number);

    const court = await db.court.findUnique({ where: { id: courtId } });
    if (!court) {
      return new NextResponse("Cancha no encontrada", { status: 404 });
    }

    const newBooking = await db.booking.create({
      data: {
        courtId,
        guestName,
        date: new Date(date),
        startTime: hour,
        startMinute: minute,
        totalPrice: court.pricePerHour,
        depositPaid: 0,
        remainingBalance: court.pricePerHour,
        status: "CONFIRMADO",
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("[COMPLEX_BOOKINGS_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
