// app/api/fixed-slots/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { toDate } from "date-fns-tz";
import { BookingStatus, FixedSlotType } from "@prisma/client";
import { addDays, getDay, startOfDay } from "date-fns";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

// GET: Obtiene todas las reglas de turnos fijos
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
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(fixedSlots);
}

// POST: Crea una nueva regla de turno fijo
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const body = await req.json();
  const {
    complexId,
    userId,
    courtId,
    dayOfWeek,
    startTime,
    endTime,
    startDate,
    price,
    notes,
    type,
  } = body;

  if (
    !complexId ||
    !userId ||
    !courtId ||
    dayOfWeek === null ||
    dayOfWeek === undefined ||
    !startTime ||
    !endTime ||
    !startDate ||
    !type
  ) {
    return new NextResponse("Faltan datos para crear el turno fijo", {
      status: 400,
    });
  }

  if (!Object.values(FixedSlotType).includes(type)) {
    return new NextResponse("Tipo de turno fijo no válido", { status: 400 });
  }

  const parsedDayOfWeek = parseInt(dayOfWeek, 10);
  const parsedPrice = parseInt(price, 10) || 0;

  // --- CÁLCULO DE MINUTOS PARA VALIDACIÓN DE HORARIO ---
  const [newStartH, newStartM] = startTime.split(":").map(Number);
  const [newEndH, newEndM] = endTime.split(":").map(Number);
  const newStartMinutes = newStartH * 60 + newStartM;
  const newEndMinutes = newEndH * 60 + newEndM;

  if (newStartMinutes >= newEndMinutes) {
        return new NextResponse(
            "La hora de inicio debe ser menor a la hora de fin.",
            { status: 400 }
        );
    }
    
    // Configuramos el rango de chequeo (30 días hacia adelante)
    const checkDateStart = startOfDay(new Date()); 
    const checkDateEnd = addDays(checkDateStart, 30);
    
    const existingRules = await db.fixedSlot.findMany({
        where: {
            courtId,
            dayOfWeek: parsedDayOfWeek,
        },
        include: { user: { select: { name: true } } },
    });

    // --- 2. CHEQUEAR CONTRA REGLAS DE ABONO EXISTENTES ---
   const overlappingRule = existingRules.find((rule) => {
        const [existingStartH, existingStartM] = rule.startTime.split(":").map(Number);
        const existingStartMinutes = existingStartH * 60 + existingStartM;
        const [existingEndH, existingEndM] = rule.endTime.split(":").map(Number);
        const existingEndMinutes = existingEndH * 60 + existingEndM;

        return (
            newStartMinutes < existingEndMinutes &&
            newEndMinutes > existingStartMinutes
        );
    });

    if (overlappingRule) {
        return new NextResponse(
            `El horario de ${startTime} a ${endTime} se superpone con una regla de abono existente de ${overlappingRule.user.name}.`,
            { status: 409 }
        );
    }


   // --- 3. CHEQUEAR CONTRA RESERVAS (BOOKINGS) EXISTENTES ---
    const conflictingBookings = await db.booking.findMany({
        where: {
            courtId,
            date: { gte: checkDateStart, lte: checkDateEnd }, // Rango de 30 días
            status: { not: BookingStatus.CANCELADO },
        },
        include: { court: { select: { slotDurationMinutes: true } } },
    });

    const overlappingBooking = conflictingBookings.find((booking) => {
        // Debemos chequear si el día de la reserva (ej: Lunes) coincide con el día de la regla (ej: 1)
        if (getDay(booking.date) !== parsedDayOfWeek) return false; 

        const existingStartMinutes = booking.startTime * 60 + (booking.startMinute || 0);
        const existingEndMinutes = existingStartMinutes + booking.court.slotDurationMinutes;

        // Lógica de solapamiento
        return (
            newStartMinutes < existingEndMinutes &&
            newEndMinutes > existingStartMinutes
        );
    });

    if (overlappingBooking) {
        return NextResponse.json(
            {
                message: `La nueva regla se solapa con una reserva existente de ${overlappingBooking.guestName || "Cliente"} en ese día de la semana.`,
            },
            { status: 409 }
        );
    }
    
    // --- 4. CHEQUEAR CONTRA BLOQUEOS (BlockedSlot) EXISTENTES ---
    const conflictingBlocks = await db.blockedSlot.findMany({
        where: {
            courtId,
            date: { gte: checkDateStart, lte: checkDateEnd }, // Rango de 30 días
        }
    });

    const overlappingBlock = conflictingBlocks.find((block) => {
        // Chequeamos si el día del bloqueo coincide con el día de la regla
        if (getDay(block.date) !== parsedDayOfWeek) return false; 

        const [blockStartHour, blockStartMinute] = block.startTime.split(":").map(Number);
        const [blockEndHour, blockEndMinute] = block.endTime.split(":").map(Number);

        const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
        const blockEndMinutes = blockEndHour * 60 + blockEndMinute;

        return (
            newStartMinutes < blockEndMinutes &&
            newEndMinutes > blockStartMinutes
        );
    });
    
    if (overlappingBlock) {
        return NextResponse.json(
            {
                message: `La nueva regla se solapa con un bloqueo (${overlappingBlock.reason || 'Mantenimiento'}) en ese día de la semana.`,
            },
            { status: 409 }
        );
    }
    
    // --- 5. CREAR REGLA DE ABONO ---
    const startDateUtc = toDate(startDate, { timeZone: ARGENTINA_TIME_ZONE });

    const newFixedSlot = await db.fixedSlot.create({
        data: {
            complexId,
            userId,
            courtId,
            dayOfWeek: parsedDayOfWeek,
            startTime,
            endTime,
            startDate: startDateUtc,
            price: parsedPrice,
            notes,
            type: type,
        },
        include: {
            user: { select: { id: true, name: true } },
            court: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(newFixedSlot, { status: 201 });
}
