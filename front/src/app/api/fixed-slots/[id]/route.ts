// app/api/fixed-slots/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { toDate, toZonedTime } from "date-fns-tz";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import { addDays, isBefore, startOfDay } from "date-fns";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const complexId = searchParams.get("complexId");

  if (!complexId) {
    return new NextResponse("Falta complexId", { status: 400 });
  }

  const fixedSlots = await db.fixedSlot.findMany({
    where: { complexId },
    include: {
      user: { select: { id: true, name: true } },
      court: { select: { id: true, name: true } },
    },
    orderBy: {
      dayOfWeek: "asc",
      startTime: "asc",
    },
  });

  return NextResponse.json(fixedSlots);
}

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

    // --- LÓGICA PARA CREAR UN BLOQUEO (BlockedSlot) ---
    if (body.isBlockedSlot === true) {
      const { courtId, date, startTime, endTime, reason } = body;

      if (!courtId || !date || !startTime || !endTime) {
        return NextResponse.json(
          { message: "Faltan datos para crear el bloqueo" },
          { status: 400 }
        );
      }

      const blockDateUtc = toDate(`${date}T00:00:00`, {
        timeZone: ARGENTINA_TIME_ZONE,
      });
      const startOfBlockDayUtc = startOfDay(blockDateUtc);

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const newBlockStartMinutes = startHour * 60 + startMinute;
      const newBlockEndMinutes = endHour * 60 + endMinute;

      if (newBlockStartMinutes >= newBlockEndMinutes) {
        return NextResponse.json(
          { message: "La hora de inicio debe ser anterior a la hora de fin." },
          { status: 400 }
        );
      }

      // 1. Chequear contra Bookings existentes
      const existingBookings = await db.booking.findMany({
        where: {
          courtId,
          date: {
            gte: startOfBlockDayUtc,
            lt: addDays(startOfBlockDayUtc, 1),
          },
          status: { not: "CANCELADO" },
        },
        include: { court: { select: { slotDurationMinutes: true } } },
      });

      const overlappingBooking = existingBookings.find((booking) => {
        const existingStartMinutes =
          booking.startTime * 60 + (booking.startMinute || 0);
        const existingEndMinutes =
          existingStartMinutes + booking.court.slotDurationMinutes;
        return (
          newBlockStartMinutes < existingEndMinutes &&
          newBlockEndMinutes > existingStartMinutes
        );
      });

      if (overlappingBooking) {
        return NextResponse.json(
          {
            message: `Este horario se solapa con una reserva existente (${
              overlappingBooking.guestName || "Cliente"
            }).`,
          },
          { status: 409 }
        );
      }

      // 2. Chequear contra otros Bloqueos (BlockedSlot)
      const existingBlocks = await db.blockedSlot.findMany({
        where: {
          courtId,
          date: startOfBlockDayUtc,
        },
      });

      const overlappingBlock = existingBlocks.find((block) => {
        const [blockStartHour, blockStartMinute] = block.startTime
          .split(":")
          .map(Number);
        const [blockEndHour, blockEndMinute] = block.endTime
          .split(":")
          .map(Number);
        const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
        const blockEndMinutes = blockEndHour * 60 + blockEndMinute;

        return (
          newBlockStartMinutes < blockEndMinutes &&
          newBlockEndMinutes > blockStartMinutes
        );
      });

      if (overlappingBlock) {
        return NextResponse.json(
          {
            message: `Este horario se solapa con otro bloqueo: ${
              overlappingBlock.reason || "Mantenimiento"
            }`,
          },
          { status: 409 }
        );
      }

      const newBlockedSlot = await db.blockedSlot.create({
        data: {
          complexId,
          courtId,
          date: blockDateUtc,
          startTime,
          endTime,
          reason,
        },
      });
      return NextResponse.json(newBlockedSlot, { status: 201 });
    }

    // --- LÓGICA PARA CREAR UNA RESERVA ---
    const {
      courtId,
      guestName,
      guestPhone,
      date,
      time,
      status,
      depositPaid,
      paymentMethod,
    } = body;

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

    if (isBefore(bookingDateUtc, new Date())) {
      return NextResponse.json(
        {
          message: "No se pueden crear reservas en horarios pasados.",
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

    const startOfBookingDayUtc = toDate(`${date}T00:00:00`, {
      timeZone: ARGENTINA_TIME_ZONE,
    });

    const newBookingStartMinutes = hour * 60 + minute;
    const newBookingEndMinutes =
      newBookingStartMinutes + court.slotDurationMinutes;

    // 1. Chequear contra Bookings existentes
    const existingBookings = await db.booking.findMany({
      where: {
        courtId,
        date: {
          gte: startOfBookingDayUtc,
          lt: addDays(startOfBookingDayUtc, 1),
        },
        status: { not: "CANCELADO" },
      },
      include: { court: { select: { slotDurationMinutes: true } } },
    });

    const isOverlappingBooking = existingBookings.some((existingBooking) => {
      const existingStartMinutes =
        existingBooking.startTime * 60 + (existingBooking.startMinute || 0);
      const existingEndMinutes =
        existingStartMinutes + existingBooking.court.slotDurationMinutes;
      return (
        newBookingStartMinutes < existingEndMinutes &&
        newBookingEndMinutes > existingStartMinutes
      );
    });

    if (isOverlappingBooking) {
      return NextResponse.json(
        { message: "El horario para esta cancha ya está ocupado." },
        { status: 409 }
      );
    }

    // 2. Chequear contra Bloqueos (BlockedSlot)
    const overlappingBlock = await db.blockedSlot.findFirst({
      where: {
        courtId,
        date: startOfBookingDayUtc,
      },
    });

    if (overlappingBlock) {
      const [blockStartHour, blockStartMinute] = overlappingBlock.startTime
        .split(":")
        .map(Number);
      const [blockEndHour, blockEndMinute] = overlappingBlock.endTime
        .split(":")
        .map(Number);
      const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
      const blockEndMinutes = blockEndHour * 60 + blockEndMinute;

      const isOverlappingBlock =
        newBookingStartMinutes < blockEndMinutes &&
        newBookingEndMinutes > blockStartMinutes;

      if (isOverlappingBlock) {
        return NextResponse.json(
          {
            message: `Este horario está bloqueado por: ${
              overlappingBlock.reason || "Mantenimiento"
            }`,
          },
          { status: 409 }
        );
      }
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
        depositAmount: 0,
        depositPaid: amountPaid,
        remainingBalance: totalPrice - amountPaid,
        status: (status || "PENDIENTE") as BookingStatus,
        paymentMethod: (paymentMethod as PaymentMethod) || null,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const slotToDelete = await db.fixedSlot.findUnique({
      where: { id },
      select: { complex: { select: { managerId: true } } },
    });

    if (!slotToDelete) {
      return new NextResponse("Regla no encontrada", { status: 404 });
    }

    if (slotToDelete.complex?.managerId !== session.user.id) {
      return new NextResponse("Permiso denegado", { status: 403 });
    }

    const nowInArg = toZonedTime(new Date(), ARGENTINA_TIME_ZONE);
    const startOfTodayArg = startOfDay(nowInArg);

    // Usar una transacción para asegurar que ambas operaciones se completen
    await db.$transaction(async (tx) => {
      // 1. BORRAR TODOS LOS TURNOS (BOOKINGS) FUTUROS ASOCIADOS
      const deletedBookings = await tx.booking.deleteMany({
        where: {
          fixedSlotId: id,
          date: {
            gte: startOfTodayArg,
          },
        },
      });
      console.log(
        `[FIXED_SLOT_DELETE] Regla ${id} eliminada. Turnos futuros limpiados: ${deletedBookings.count}`
      );

      // 2. BORRAR LA REGLA (FixedSlot)
      await tx.fixedSlot.delete({
        where: { id: id },
      });
    });

    return NextResponse.json(
      {
        message:
          "Regla eliminada y todos los turnos futuros han sido limpiados.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FIXED_SLOT_DELETE]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
