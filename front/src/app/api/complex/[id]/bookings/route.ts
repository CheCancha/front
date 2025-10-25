import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { startOfDay, endOfDay, isSameDay, isBefore, parseISO, addDays } from "date-fns";
import { toDate } from "date-fns-tz";
import { BookingStatus } from "@prisma/client";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

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

    // --- LÓGICA PARA PRÓXIMAS RESERVAS ---
    if (searchParams.get("upcoming") === "true") {
      const nowArgentina = toDate(new Date(), {
        timeZone: ARGENTINA_TIME_ZONE,
      });
      const todayArgentina = startOfDay(nowArgentina);

      const currentHour = nowArgentina.getHours();
      const currentMinute = nowArgentina.getMinutes();
      const today = todayArgentina;

      const potentialBookings = await db.booking.findMany({
        where: {
          court: { complexId: complexId },
          date: { gte: today },
          status: BookingStatus.CONFIRMADO,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: {
          court: { select: { name: true } },
          user: { select: { name: true, phone: true } },
          coupon: { select: { code: true } },
        },
      });

      const upcomingBookings = potentialBookings
        .filter((booking) => {
          const bookingDate = startOfDay(booking.date);
          const isBookingToday = isSameDay(bookingDate, today);

          if (!isBookingToday) {
            return true;
          }

          const bookingHour = booking.startTime;
          const bookingMinute = booking.startMinute ?? 0;

          if (bookingHour > currentHour) return true;
          if (bookingHour === currentHour && bookingMinute >= currentMinute)
            return true;

          return false;
        })
        .slice(0, 10);

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
        couponCode: b.coupon?.code || null,
      }));

      return NextResponse.json(formattedBookings);
    }

    // --- LÓGICA PARA EL CALENDARIO DE RESERVAS ---
    const dateString = searchParams.get("date");
    const startDateString = searchParams.get("startDate");
    const endDateString = searchParams.get("endDate");

   let startDate: Date; 
    let endDateExclusive: Date;

    if (startDateString && endDateString) {
      // ✅ WEEK VIEW (Corrected): Interpret start and end from Argentina TZ
      startDate = toDate(`${startDateString}T00:00:00`, { timeZone: ARGENTINA_TIME_ZONE });
      // End is the start of the day AFTER endDateString
      const endDayStart = toDate(`${endDateString}T00:00:00`, { timeZone: ARGENTINA_TIME_ZONE });
      endDateExclusive = addDays(endDayStart, 1);

    } else if (dateString) {
      // ✅ DAY VIEW (Corrected): Interpret start and end from Argentina TZ
      // startDate is midnight Argentina converted to UTC
      startDate = toDate(`${dateString}T00:00:00`, { timeZone: ARGENTINA_TIME_ZONE }); 
      // endDateExclusive is midnight of the NEXT day in Argentina, converted to UTC
      endDateExclusive = addDays(startDate, 1); 

    } else {
      return new NextResponse(
        "Faltan parámetros de fecha ('date' o 'startDate'/'endDate')",
        { status: 400 }
      );
    }

    // --- DEBUG LOGS (Optional but helpful) ---
    console.log(`[GET Bookings] Fetching for complex ${complexId}`);
    console.log(`[GET Bookings] dateString: ${dateString}`);
    console.log(`[GET Bookings] Querying UTC Range: ${startDate.toISOString()} to ${endDateExclusive.toISOString()}`);
    // --- END LOGS ---

    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: complexId },
        // ✅ CORRECTED QUERY: Uses the right UTC window
        date: {
          gte: startDate,      // Greater than or equal to start of ARG day (in UTC)
          lt: endDateExclusive, // Less than start of NEXT ARG day (in UTC)
        },
        status: {
          in: [
            BookingStatus.CONFIRMADO,
            BookingStatus.PENDIENTE,
            BookingStatus.COMPLETADO,
          ],
        },
      },
      include: {
        court: { select: { id: true, name: true, slotDurationMinutes: true } },
        user: { select: { name: true, phone: true } },
        coupon: true,
      },
       orderBy: { // Optional: order bookings chronologically
         date: 'asc',
       }
    });

    console.log(`[GET Bookings] Found ${bookings.length} bookings for the range.`); // DEBUG LOG

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
      return NextResponse.json(
        { message: "Faltan datos para crear la reserva" },
        {
          status: 400,
        }
      );
    }

    const bookingDateUtc = toDate(
      `${date}T${time.length === 5 ? `${time}:00` : time}`,
      { timeZone: ARGENTINA_TIME_ZONE }
    );

    // ⚠️ MODIFICACIÓN CLAVE: Usamos 'new Date()' directamente sin el offset.
    // new Date() siempre retorna la hora actual del sistema en UTC.
    if (isBefore(bookingDateUtc, new Date())) {
      return NextResponse.json(
        {
          message: "No se pueden crear reservas en horarios pasados.",
          // 💡 DEBUG: Retorna valores para verificar en la consola de tu navegador
          debug: {
            bookingUtc: bookingDateUtc.toISOString(),
            nowUtc: new Date().toISOString(),
            timeZone: ARGENTINA_TIME_ZONE,
          },
        },
        {
          status: 400,
        }
      );
    }

    const [hour, minute] = time.split(":").map(Number);

    const court = await db.court.findUnique({
      where: { id: courtId },
      include: { priceRules: true },
    });
    if (!court) {
      return NextResponse.json(
        { message: "Cancha no encontrada" },
        { status: 404 }
      );
    }

    const applicableRule = court.priceRules.find(
      (rule) => hour >= rule.startTime && hour < rule.endTime
    );
    if (!applicableRule) {
      return NextResponse.json(
        { message: `No hay un precio configurado para las ${time} hs.` },
        { status: 400 }
      );
    }

    const newBookingStartMinutes = hour * 60 + minute;
    const newBookingEndMinutes =
      newBookingStartMinutes + court.slotDurationMinutes;

    const startOfBookingDayUtc = toDate(`${date}T00:00:00`, {
      timeZone: ARGENTINA_TIME_ZONE,
    });
    const endOfBookingDayUtc = toDate(`${date}T23:59:59.999`, {
      timeZone: ARGENTINA_TIME_ZONE,
    });

    const existingBookings = await db.booking.findMany({
      where: {
        courtId,
        date: {
          gte: startOfBookingDayUtc,
          lt: endOfBookingDayUtc,
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
      return NextResponse.json(
        { message: "El horario para esta cancha ya está ocupado." },
        {
          status: 409,
        }
      );
    }

    const totalPrice = applicableRule.price;
    const amountPaid = depositPaid || 0;

    const newBooking = await db.booking.create({
      data: {
        courtId,
        guestName,
        guestPhone,
        date: bookingDateUtc,
        startTime: hour,
        startMinute: minute,
        totalPrice,
        depositAmount: 0, // depositAmount se podría usar para "seña requerida", lo dejamos en 0 por ahora.
        depositPaid: amountPaid,
        remainingBalance: totalPrice - amountPaid,
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

    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { message: "Error: Ya existe una reserva en este horario." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
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

    const existingBooking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { totalPrice: true },
    });

    if (!existingBooking) {
      return new NextResponse("Reserva no encontrada", { status: 404 });
    }

    if (typeof updateData.depositPaid === "number") {
      updateData.remainingBalance =
        existingBooking.totalPrice - updateData.depositPaid;
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
