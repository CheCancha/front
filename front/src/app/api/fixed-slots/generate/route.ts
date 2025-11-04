// app/api/fixed-slots/generate/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { addDays, getDay, startOfDay } from "date-fns";
import { toDate } from "date-fns-tz";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

async function checkOverlap(
  courtId: string,
  date: Date,
  startMinutes: number,
  endMinutes: number
) {
  const startOfSlotDayUtc = date;
  const endOfSlotDayUtc = addDays(startOfSlotDayUtc, 1);

  // 1. Chequear Bookings
  const existingBookings = await db.booking.findMany({
    where: {
      courtId,
      date: {
        gte: startOfSlotDayUtc,
        lt: endOfSlotDayUtc,
      },
      status: { not: "CANCELADO" },
    },
    include: { court: { select: { slotDurationMinutes: true } } },
  }); // El resto de la lógica de chequeo .some() está perfecta
  const overlappingBooking = existingBookings.some((b) => {
    const bStart = b.startTime * 60 + (b.startMinute || 0);
    const bEnd = bStart + b.court.slotDurationMinutes;
    return startMinutes < bEnd && endMinutes > bStart;
  });
  if (overlappingBooking) return "Turno regular existente";

  // 2. Chequear Bloqueos
  const existingBlocks = await db.blockedSlot.findMany({
    where: { courtId, date: startOfSlotDayUtc },
  });
  const overlappingBlock = existingBlocks.some((b) => {
    const [bStartH, bStartM] = b.startTime.split(":").map(Number);
    const [bEndH, bEndM] = b.endTime.split(":").map(Number);
    const bStart = bStartH * 60 + bStartM;
    const bEnd = bEndH * 60 + bEndM;
    return startMinutes < bEnd && endMinutes > bStart;
  });
  if (overlappingBlock) return "Horario bloqueado";

  return null;
}

// POST: Genera los próximos X turnos para un Abono
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const body = await req.json();
  const { fixedSlotId, weeksToGenerate = 4 } = body;

  if (!fixedSlotId) {
    return new NextResponse("Falta fixedSlotId", { status: 400 });
  }

  const rule = await db.fixedSlot.findUnique({
    where: { id: fixedSlotId },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!rule) {
    return new NextResponse("Regla de abono no encontrada", { status: 404 });
  }

  const lastBooking = await db.booking.findFirst({
    where: { fixedSlotId: rule.id },
    orderBy: { date: "desc" },
  });

  const today = startOfDay(new Date());
  let currentDate = startOfDay(lastBooking ? lastBooking.date : rule.startDate);

  if (!lastBooking && currentDate < today) {
    currentDate = today;
  }

  if (lastBooking) {
    currentDate = addDays(currentDate, 1);
  }

  const bookingsCreated = [];
  const bookingsSkipped = [];
  const [startHour, startMinute] = rule.startTime.split(":").map(Number);
  const [endHour, endMinute] = rule.endTime.split(":").map(Number);

  const newBookingStartMinutes = startHour * 60 + startMinute;
  const newBookingEndMinutes = endHour * 60 + endMinute;

  for (let i = 0; i < weeksToGenerate; i++) {
    while (getDay(currentDate) !== rule.dayOfWeek) {
      currentDate = addDays(currentDate, 1);
    }

    const bookingDateWithTime = toDate(
      `${currentDate.toISOString().split("T")[0]}T${rule.startTime}:00`,
      { timeZone: ARGENTINA_TIME_ZONE }
    );

    const overlapError = await checkOverlap(
      rule.courtId,
      bookingDateWithTime,
      newBookingStartMinutes,
      newBookingEndMinutes
    );

    if (overlapError) {
      bookingsSkipped.push({
        date: currentDate.toISOString().split("T")[0],
        reason: overlapError,
      });
    } else {
      try {
        const newBooking = await db.$transaction(async (tx) => {
          // 1. Creamos la Reserva (Booking)
          const createdBooking = await tx.booking.create({
            data: {
              courtId: rule.courtId,
              userId: rule.userId,
              fixedSlotId: rule.id,
              date: bookingDateWithTime,
              startTime: startHour,
              startMinute: startMinute,
              totalPrice: rule.price,
              depositAmount: 0,
              depositPaid: 0,
              totalPaid: 0,
              remainingBalance: rule.price,
              status: "CONFIRMADO",
              guestName: rule.user.name,
              guestPhone: null,
              paymentMethod: null,
            },
          });

          await tx.bookingPlayer.create({
            data: {
              bookingId: createdBooking.id,
              userId: rule.userId,
              guestName: rule.user.name,
              paymentStatus: "PENDIENTE",
              amountPaid: 0,
              paymentMethod: null,
            },
          });

          return createdBooking;
        });
        bookingsCreated.push(newBooking);
      } catch (txError) {
        console.error("Error en transacción de generación de abono:", txError);
        bookingsSkipped.push({
          date: currentDate.toISOString().split("T")[0],
          reason: "Error de base de datos al crear",
        });
      }
    }

    currentDate = addDays(currentDate, 7);
  }

  return NextResponse.json({
    message: `Turnos generados: ${bookingsCreated.length}. Turnos omitidos: ${bookingsSkipped.length}.`,
    skipped: bookingsSkipped,
  });
}
