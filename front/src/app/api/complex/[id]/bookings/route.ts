import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { startOfDay, endOfDay, startOfToday, subMinutes } from "date-fns";
import { BookingStatus } from "@prisma/client";

// --- GET ---
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const complexId = (await context.params).id;

    // --- LÓGICA PARA PRÓXIMAS RESERVAS  ---
    if (searchParams.get("upcoming") === "true") {
      const today = startOfToday();
      const upcomingBookings = await db.booking.findMany({
        where: {
          court: { complexId: complexId },
          date: { gte: today },
          status: BookingStatus.CONFIRMADO,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 10,
        include: {
          court: { select: { name: true } },
          user: { select: { name: true, phone: true } },
        },
      });

      const formattedBookings = upcomingBookings.map((b) => ({
        id: b.id,
        customerName: b.user?.name || b.guestName,
        customerPhone: b.user?.phone || b.guestPhone,
        courtName: b.court.name,
        date: b.date,
        startTime: `${String(b.startTime).padStart(2, "0")}:${String(
          b.startMinute ?? 0
        ).padStart(2, "0")}`,
        isPaid: b.depositAmount > 0,
      }));

      return NextResponse.json(formattedBookings);
    }

    // --- LÓGICA PARA EL CALENDARIO DE RESERVAS ---
    const dateString = searchParams.get("date");
    if (!dateString) {
      return new NextResponse("El parámetro 'date' es obligatorio", {
        status: 400,
      });
    }
    const requestedDate = new Date(`${dateString}T00:00:00.000Z`);
    const startOfRequestedDay = startOfDay(requestedDate);
    const endOfRequestedDay = endOfDay(requestedDate);

    const thirtyMinutesAgo = subMinutes(new Date(), 2);

    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: complexId },
        date: {
          gte: startOfRequestedDay,
          lt: endOfRequestedDay,
        },
        AND: [
          { status: { not: BookingStatus.CANCELADO } },
          {
            OR: [
              { status: { not: BookingStatus.PENDIENTE } },
              { createdAt: { gte: thirtyMinutesAgo } },
            ],
          },
        ],
      },
      include: {
        court: { select: { id: true, name: true, slotDurationMinutes: true } },
        user: { select: { name: true, phone: true } },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("💥 ERROR en GET de bookings:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// --- POST ---
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { courtId, guestName, guestPhone, date, time, status, depositPaid } =
      body;

    if (!courtId || !guestName || !date || !time) {
      return new NextResponse("Faltan datos para crear la reserva", {
        status: 400,
      });
    }

    const [hour, minute] = time.split(":").map(Number);

    const court = await db.court.findUnique({
      where: { id: courtId },
      include: { priceRules: true },
    });
    if (!court) {
      return new NextResponse("Cancha no encontrada", { status: 404 });
    }

    const applicableRule = court.priceRules.find(
      (rule) => hour >= rule.startTime && hour < rule.endTime
    );
    if (!applicableRule) {
      return new NextResponse(
        `No hay un precio configurado para las ${time} hs.`,
        { status: 400 }
      );
    }

    const bookingDate = new Date(`${date}T${time}`);

    const newBookingStartMinutes = hour * 60 + minute;
    const newBookingEndMinutes =
      newBookingStartMinutes + court.slotDurationMinutes;

    // 2. Para buscar superposiciones, debemos buscar en TODO el día, no solo a medianoche.
    const startOfBookingDay = startOfDay(bookingDate);
    const endOfBookingDay = endOfDay(bookingDate);

    const existingBookings = await db.booking.findMany({
      where: {
        courtId,
        date: {
          gte: startOfBookingDay,
          lt: endOfBookingDay,
        },
        status: { not: "CANCELADO" },
      },
      include: { court: { select: { slotDurationMinutes: true } } },
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
      return new NextResponse("El horario para esta cancha ya está ocupado.", {
        status: 409,
      });
    }

    const totalPrice = applicableRule.price;
    const depositAmount = depositPaid || 0;

    const newBooking = await db.booking.create({
      data: {
        courtId,
        guestName,
        guestPhone,
        date: bookingDate,
        startTime: hour,
        startMinute: minute,
        totalPrice,
        depositAmount,
        depositPaid,
        remainingBalance: totalPrice - depositAmount,
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
  } catch (error) {
    console.error("💥 ERROR en POST de bookings:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// --- PATCH ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    delete updateData.courtId;
    delete updateData.time;
    delete updateData.date;
    delete updateData.totalPrice;

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
        user: { select: { name: true, phone: true } },
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("💥 ERROR en PATCH de bookings:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
