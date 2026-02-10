import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { startOfDay, isSameDay, isBefore, addDays, getDay } from "date-fns";
import { toDate } from "date-fns-tz";
import { BookingStatus, PaymentMethod } from "@prisma/client";

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
      startDate = toDate(`${startDateString}T00:00:00`, {
        timeZone: ARGENTINA_TIME_ZONE,
      });
      const endDayStart = toDate(`${endDateString}T00:00:00`, {
        timeZone: ARGENTINA_TIME_ZONE,
      });
      endDateExclusive = addDays(endDayStart, 1);
    } else if (dateString) {
      startDate = toDate(`${dateString}T00:00:00`, {
        timeZone: ARGENTINA_TIME_ZONE,
      });
      endDateExclusive = addDays(startDate, 1);
    } else {
      return new NextResponse(
        "Faltan parámetros de fecha ('date' o 'startDate'/'endDate')",
        { status: 400 }
      );
    }

    const whereDateClause = {
      gte: startDate,
      lt: endDateExclusive,
    };

    const [bookings, blockedSlots] = await Promise.all([
      db.booking.findMany({
        where: {
          court: { complexId: complexId },
          date: whereDateClause,
          status: {
            in: [
              BookingStatus.CONFIRMADO,
              BookingStatus.PENDIENTE,
              BookingStatus.COMPLETADO,
            ],
          },
        },
        include: {
          court: {
            select: { id: true, name: true, slotDurationMinutes: true },
          },
          user: { select: { name: true, phone: true } },
          coupon: true,
          fixedSlot: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      }),

      db.blockedSlot.findMany({
        where: {
          complexId: complexId,
          date: whereDateClause,
        },
        include: {
          court: { select: { id: true, name: true } },
        },
      }),
    ]);

    const formattedBookings = bookings.map((b) => ({
      ...b,
      type: "BOOKING" as const,
      user: b.user || b.fixedSlot?.user,
      status: b.fixedSlot
        ? b.fixedSlot.type === "ENTRENAMIENTO"
          ? "ENTRENAMIENTO"
          : "ABONO"
        : b.status,
    }));

    const formattedBlockedSlots = blockedSlots.map((b) => {
      const [hour, minute] = b.startTime.split(":").map(Number);
      return {
        id: b.id,
        type: "BLOCKED_SLOT" as const,
        date: b.date,
        startTime: hour,
        startMinute: minute,
        endTime: b.endTime,
        courtId: b.court.id,
        court: b.court,
        user: { name: b.reason || "Horario Bloqueado" },
        status: "BLOQUEADO" as const,
      };
    });

    const allEvents = [...formattedBookings, ...formattedBlockedSlots];

    return NextResponse.json(allEvents);
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
    // BLOQUE 1: SEGURIDAD Y CONTEXTO
    const { id: complexId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();

    // BLOQUE 2: bloqueo o reserva
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

      // NORMALIZACIÓN DE HORAS
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

      //  BLOQUE 3: VALIDACIÓN DE SOLAPAMIENTO PARA BLOQUEO
      // 1
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
        const existingStartMinutes = booking.startTime * 60 + (booking.startMinute || 0);
        const existingEndMinutes = existingStartMinutes + booking.court.slotDurationMinutes;
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

      // 2
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

      // 3
      const dayOfWeek = getDay(blockDateUtc);
      const matchingFixedSlotRules = await db.fixedSlot.findMany({
        where: {
          courtId,
          dayOfWeek,
          startDate: { lte: blockDateUtc },
          OR: [{ endDate: null }, { endDate: { gte: blockDateUtc } }],
        },
      });

      const overlappingAbono = matchingFixedSlotRules.find((rule) => {
        const [abonoStartHour, abonoStartMinute] = rule.startTime
          .split(":")
          .map(Number);
        const [abonoEndHour, abonoEndMinute] = rule.endTime
          .split(":")
          .map(Number);
        const abonoStartMinutes = abonoStartHour * 60 + abonoStartMinute;
        const abonoEndMinutes = abonoEndHour * 60 + abonoEndMinute;

        return (
          newBlockStartMinutes < abonoEndMinutes &&
          newBlockEndMinutes > abonoStartMinutes
        );
      });

      if (overlappingAbono) {
        return NextResponse.json(
          { message: `Este horario está reservado por un abono fijo.` },
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

    // --- LÓGICA PARA CREAR RESERVA DE ABONO ---
    if (body.fixedSlotId) {
      const fixedSlot = await db.fixedSlot.findUnique({
        where: { id: body.fixedSlotId },
        include: { user: true, court: true },
      });

      if (!fixedSlot) {
        return NextResponse.json(
          { message: "Abono fijo no encontrado" },
          { status: 404 }
        );
      }

      const bookingDateUtc = toDate(`${body.date}T${fixedSlot.startTime}:00`, {
        timeZone: ARGENTINA_TIME_ZONE,
      });

      const [hour, minute] = fixedSlot.startTime.split(":").map(Number);

      const newBooking = await db.$transaction(async (tx) => {
        const priceInCents = (fixedSlot.price || 0) * 100;

        const createdBooking = await tx.booking.create({
          data: {
            courtId: fixedSlot.courtId,
            userId: fixedSlot.userId,
            date: bookingDateUtc,
            startTime: hour,
            startMinute: minute,
            totalPrice: priceInCents,
            depositAmount: 0,
            depositPaid: 0,
            remainingBalance: priceInCents,
            status: BookingStatus.CONFIRMADO,
            fixedSlotId: fixedSlot.id,
          },
        });

        await tx.bookingPlayer.create({
          data: {
            bookingId: createdBooking.id,
            userId: fixedSlot.userId,
            paymentStatus: "PENDIENTE",
            amountPaid: 0,
            paymentMethod: "EFECTIVO",
          },
        });

        return createdBooking;
      });

      return NextResponse.json(newBooking, { status: 201 });
    }

    if (!courtId || !guestName || !date || !time) {
      return NextResponse.json(
        { message: "Faltan datos para crear la reserva" },
        {
          status: 400,
        }
      );
    }

    const [hour, minute] = time.split(":").map(Number);
    const bookingDateBase = toDate(`${date}T00:00:00`, {
      timeZone: ARGENTINA_TIME_ZONE,
    });

    bookingDateBase.setHours(hour);
    bookingDateBase.setMinutes(minute);

    const finalBookingDateTime = bookingDateBase;

    const nowInArgentina = toDate(new Date(), {
      timeZone: ARGENTINA_TIME_ZONE,
    });

    if (isBefore(finalBookingDateTime, nowInArgentina)) {
      return NextResponse.json(
        {
          message: "No se pueden crear reservas en horarios pasados.",
          debug: {
            bookingUtc: finalBookingDateTime.toISOString(),
            nowUtc: nowInArgentina.toISOString(),
            timeZone: ARGENTINA_TIME_ZONE,
          },
        },
        { status: 400 }
      );
    }

    // 3.  Mantenemos la lógica original para guardar en la BD la "fecha lógica" que es Nov 6 y la hora 24:30.
    const bookingDateUtc = toDate(`${date}T00:00:00`, {
      timeZone: ARGENTINA_TIME_ZONE,
    });
    const [hourToSave, minuteToSave] = time.split(":").map(Number);

    const bookingStartMinutes = hourToSave * 60 + minuteToSave;

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
      (rule) =>
        bookingStartMinutes >= rule.startTime &&
        bookingStartMinutes < rule.endTime
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
    // const endOfBookingDayUtc = toDate(`${date}T23:59:59.999`, {
    //   timeZone: ARGENTINA_TIME_ZONE,
    // });

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

    // 3. Chequear contra Abonos (FixedSlot)
    const dayOfWeek = getDay(bookingDateUtc);
    const matchingFixedSlotRule = await db.fixedSlot.findFirst({
      where: {
        courtId,
        dayOfWeek,
        startDate: { lte: bookingDateUtc },
        OR: [{ endDate: null }, { endDate: { gte: bookingDateUtc } }],
      },
    });

    if (matchingFixedSlotRule) {
      const [abonoStartHour, abonoStartMinute] = matchingFixedSlotRule.startTime
        .split(":")
        .map(Number);
      const [abonoEndHour, abonoEndMinute] = matchingFixedSlotRule.endTime
        .split(":")
        .map(Number);
      const abonoStartMinutes = abonoStartHour * 60 + abonoStartMinute;
      const abonoEndMinutes = abonoEndHour * 60 + abonoEndMinute;

      const isOverlappingAbono =
        newBookingStartMinutes < abonoEndMinutes &&
        newBookingEndMinutes > abonoStartMinutes;

      if (isOverlappingAbono) {
        return NextResponse.json(
          { message: `Este horario está reservado por un abono fijo.` },
          { status: 409 }
        );
      }
    }

    const totalPriceInCents = applicableRule.price || 0;
    const amountPaidInCents = (depositPaid || 0) * 100;

    // BLOQUE 4: ACID
    const newBooking = await db.$transaction(async (tx) => {
      // PASO 1: Crear la Reserva
      const createdBooking = await tx.booking.create({
        data: {
          courtId,
          guestName,
          guestPhone,
          date: bookingDateUtc,
          startTime: hourToSave,
          startMinute: minuteToSave,
          totalPrice: totalPriceInCents,
          depositAmount: 0,
          depositPaid: amountPaidInCents,
          remainingBalance: totalPriceInCents - amountPaidInCents,
          status: (status || "PENDIENTE") as BookingStatus,
          paymentMethod: (paymentMethod as PaymentMethod) || null,
        },
      });

      // PASO 2: Registrar al Jugador
      const player = await tx.bookingPlayer.create({
        data: {
          bookingId: createdBooking.id,
          guestName: guestName,
          amountPaid: amountPaidInCents,
          paymentStatus: amountPaidInCents > 0 ? "PAGADO" : "PENDIENTE",
          paymentMethod:
            amountPaidInCents > 0 ? (paymentMethod as PaymentMethod) : null,
        },
      });

      // PASO 3: Crear Transacción de Caja
      if (amountPaidInCents > 0 && paymentMethod) {
        await tx.transaction.create({
          data: {
            complexId: complexId,
            amount: amountPaidInCents,
            type: "INGRESO",
            source: "RESERVA",
            paymentMethod: paymentMethod as PaymentMethod,
            description: `Seña inicial por ${guestName}`,
            bookingPlayerId: player.id,
          },
        });
      }

      return createdBooking;
    });

    const bookingWithCourt = await db.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
        players: true,
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

    // --- LÓGICA DE ACTUALIZACIÓN DE BOOKING ---
    const existingBooking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { totalPrice: true, status: true, fixedSlotId: true },
    });

    if (!existingBooking) {
      return new NextResponse("Reserva no encontrada", { status: 404 });
    }

    if (existingBooking.fixedSlotId) {
      // Solo bloquear si efectivamente se intenta modificar estructura del turno
      const restrictedKeys = ["courtId", "time", "date", "totalPrice"];
      const hasRestrictedUpdate = Object.keys(updateData).some((key) =>
        restrictedKeys.includes(key)
      );

      if (hasRestrictedUpdate) {
        return new NextResponse(
          "No se pueden modificar detalles de horario/cancha de un Abono Fijo.",
          { status: 403 }
        );
      }
    }

    // Prevenir que se pisen datos clave
    delete updateData.courtId;
    delete updateData.time;
    delete updateData.date;
    delete updateData.totalPrice;

    const dataToUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => value !== undefined)
    );

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: dataToUpdate,
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
        user: { select: { name: true, phone: true } },
        players: true,
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("💥 ERROR en PATCH de bookings:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
