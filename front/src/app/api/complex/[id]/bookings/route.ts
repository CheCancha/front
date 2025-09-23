import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { BookingStatus } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

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

    // Se mantiene la lógica para interpretar la fecha en la zona horaria local del servidor
    const requestedDate = new Date(`${dateString}T00:00:00`);

    const startOfRequestedDay = startOfDay(requestedDate);
    const endOfRequestedDay = endOfDay(requestedDate);

    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: id },
        date: {
          gte: startOfRequestedDay,
          lte: endOfRequestedDay,
        },
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
    const { id: _id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { courtId, guestName, date, time, status, depositPaid } = body;

    if (!courtId || !guestName || !date || !time) {
      return new NextResponse("Faltan datos para crear la reserva", {
        status: 400,
      });
    }

    const [hour, minute] = time.split(":").map(Number);
    const court = await db.court.findUnique({ where: { id: courtId } });
    if (!court)
      return new NextResponse("Cancha no encontrada", { status: 404 });

    // --- VALIDACIÓN DE SUPERPOSICIÓN EN BACKEND ---
    const bookingDate = new Date(`${date}T00:00:00`);
    const newBookingStartMinutes = hour * 60 + minute;
    const newBookingEndMinutes =
      newBookingStartMinutes + court.slotDurationMinutes;

    const existingBookings = await db.booking.findMany({
      where: {
        courtId: courtId,
        date: bookingDate,
      },
      include: {
        court: { select: { slotDurationMinutes: true } },
      },
    });

    const isOverlapping = existingBookings.some((existingBooking) => {
      const existingStartMinutes =
        existingBooking.startTime * 60 + (existingBooking.startMinute || 0);
      const existingEndMinutes =
        existingStartMinutes + existingBooking.court.slotDurationMinutes;

      return (
        newBookingStartMinutes < existingEndMinutes &&
        newBookingEndMinutes > existingStartMinutes
      );
    });

    if (isOverlapping) {
      return new NextResponse(
        "El horario para esta cancha ya está ocupado o se superpone con otra reserva.",
        { status: 409 }
      );
    }
    // --- FIN DE LA VALIDACIÓN ---

    const newBooking = await db.booking.create({
      data: {
        courtId,
        guestName,
        date: bookingDate,
        startTime: hour,
        startMinute: minute,
        totalPrice: court.pricePerHour,
        depositPaid: depositPaid || 0,
        remainingBalance: court.pricePerHour - (depositPaid || 0),
        status: (status || "PENDIENTE") as BookingStatus,
      },
    });

    const bookingWithCourt = await db.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
      },
    });

    return NextResponse.json(bookingWithCourt, { status: 201 });
  } catch (error: unknown) {
    console.error("[COMPLEX_BOOKINGS_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { bookingId, ...updateData } = body;

    if (!bookingId) {
      return new NextResponse("Falta el ID de la reserva", { status: 400 });
    }

    // Prevenir la modificación de datos que podrían causar inconsistencias
    delete updateData.courtId;
    delete updateData.time;
    delete updateData.date;

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("[COMPLEX_BOOKINGS_PATCH]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
