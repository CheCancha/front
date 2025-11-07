import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { addDays, subMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { BookingStatus } from "@prisma/client";


const parseMinutesFromString = (hourString: unknown): number | undefined => {
  if (typeof hourString !== "string" || !hourString.includes(":")) {
    return undefined;
  }
  try {
    const [hour, minute] = hourString.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) return undefined;
    return hour * 60 + minute;
  } catch (e) {
    return undefined;
  }
};


export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("date");

    if (!dateString) {
      return NextResponse.json(
        { error: "El parámetro 'date' es obligatorio" },
        { status: 400 }
      );
    }

    const TIMEZONE = "America/Argentina/Buenos_Aires";
   const requestedDayStart = toDate(`${dateString}T00:00:00`, {
      timeZone: TIMEZONE,
    });
    const requestedDayEnd = addDays(requestedDayStart, 1);
    const nowUtc = new Date();
    const fiveMinutesAgo = subMinutes(nowUtc, 5);
    const requestedDayKey = formatInTimeZone(
      requestedDayStart,
      TIMEZONE,
      "yyyy-MM-dd"
    );
    const todayKey = formatInTimeZone(nowUtc, TIMEZONE, "yyyy-MM-dd");
    const isToday = requestedDayKey === todayKey;
    const currentHour = Number(formatInTimeZone(nowUtc, TIMEZONE, "H"));
    const currentMinute = Number(formatInTimeZone(nowUtc, TIMEZONE, "m"));
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const complex = await db.complex.findUnique({
      where: { slug: slug },
      include: {
        schedule: true,
        courts: {
          include: {
            bookings: {
              where: {
                date: {
                  gte: requestedDayStart,
                  lt: requestedDayEnd,
                },
                AND: [
                  { status: { not: BookingStatus.CANCELADO } },
                  {
                    OR: [
                      { status: { not: BookingStatus.PENDIENTE } },
                      { createdAt: { gte: fiveMinutesAgo } },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    });

    if (!complex) {
      return NextResponse.json(
        { error: "Complejo no encontrado" },
        { status: 404 }
      );
    }

    const timeGridInterval = complex.timeSlotInterval;
    const isoDayOfWeek = Number(
      formatInTimeZone(requestedDayStart, TIMEZONE, "i")
    );
    const dayOfWeek = isoDayOfWeek % 7;
    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const key = dayKeys[dayOfWeek];

    // --- BLOQUE LÓGICO MODIFICADO ---
    let openMinutes: number | undefined;
    let closeMinutes: number | undefined;

    if (complex.schedule) {
      const scheduleAsRecord = complex.schedule as Record<string, unknown>;
      // Leemos los strings "12:30" y "27:00"
      const rawOpenHour = scheduleAsRecord[`${key}Open`];
      const rawCloseHour = scheduleAsRecord[`${key}Close`];

      // Usamos el helper NUEVO para convertirlos a minutos (750 y 1620)
      openMinutes = parseMinutesFromString(rawOpenHour);
      closeMinutes = parseMinutesFromString(rawCloseHour);
    }

    if (typeof openMinutes !== "number" || typeof closeMinutes !== "number") {
      console.warn(`[Availability API] No hay horario para ${key}, usando default.`);
      openMinutes = 9 * 60; // 540
      closeMinutes = 23 * 60; // 1380
    }

    if (closeMinutes < openMinutes) {
      closeMinutes += 1440; // 180 + 1440 = 1620 (así 27:00)
    }
    
    // Si el complejo está cerrado (ej: 0 y 0)
    if (openMinutes === closeMinutes) {
        return NextResponse.json([]);
    }

     const availabilityMap = new Map<string, boolean[]>();
    
    const totalSlots = Math.floor((closeMinutes - openMinutes) / timeGridInterval);

    for (const court of complex.courts) {
      const courtSlots = new Array(totalSlots).fill(true);
      for (const booking of court.bookings) {
        // El 'startTime' de la reserva (ej: 24) se convierte a minutos
        const bookingStartMinutes =
          booking.startTime * 60 + (booking.startMinute || 0);

        // El índice se calcula restando los minutos de apertura
        const startIdx =
          (bookingStartMinutes - openMinutes) / timeGridInterval;
          
        const slotsToBook = court.slotDurationMinutes / timeGridInterval;
        for (let i = 0; i < slotsToBook; i++) {
          if (startIdx + i < totalSlots) {
            courtSlots[startIdx + i] = false;
          }
        }
      }
      availabilityMap.set(court.id, courtSlots);
    }

    const validStartTimes: {
      time: string;
      courts: { courtId: string; available: boolean }[];
    }[] = [];

    let currentTime = openMinutes;
    const closingTime = closeMinutes;

    while (currentTime < closingTime) {
      if (isToday && currentTime < currentTimeInMinutes) {
        currentTime += timeGridInterval;
        continue;
      }

      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;

      const timeString = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;


       const courtStatuses = complex.courts.map((court) => {
        const slotsNeeded = court.slotDurationMinutes / timeGridInterval;
        
        const currentSlotIndex =
          (currentTime - openMinutes) / timeGridInterval;

        let canBook = true;
        if (currentTime + court.slotDurationMinutes > closingTime) {
          canBook = false;
        } else {
          for (let i = 0; i < slotsNeeded; i++) {
            if (!availabilityMap.get(court.id)?.[currentSlotIndex + i]) {
              canBook = false;
              break;
            }
          }
        }
        return { courtId: court.id, available: canBook };
      });

      validStartTimes.push({ time: timeString, courts: courtStatuses });
      currentTime += timeGridInterval;
    }

    return NextResponse.json(validStartTimes);
  } catch (error) {
    console.error("[COMPLEX_AVAILABILITY_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}