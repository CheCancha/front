import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { addDays, subMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { BookingStatus } from "@prisma/client";


const parseHourString = (hourString: unknown): number | undefined => {
  if (typeof hourString !== "string") {
    return undefined;
  }
  try {
    const [hour] = hourString.split(":");
    const hourNum = parseInt(hour, 10);
    return isNaN(hourNum) ? undefined : hourNum;
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
    let openHour: number | undefined;
    let closeHour: number | undefined;

    if (complex.schedule) {
      const scheduleAsRecord = complex.schedule as Record<string, unknown>;
      // Leemos los strings "18:00" y "27:00"
      const rawOpenHour = scheduleAsRecord[`${key}Open`];
      const rawCloseHour = scheduleAsRecord[`${key}Close`];
      
      // Usamos el helper para convertirlos a números 18 y 27
      openHour = parseHourString(rawOpenHour);
      closeHour = parseHourString(rawCloseHour);
    }

    if (typeof openHour !== "number" || typeof closeHour !== "number") {
      return NextResponse.json([]);
    }

    const availabilityMap = new Map<string, boolean[]>();
    const totalSlots = (closeHour - openHour) * (60 / timeGridInterval);

    for (const court of complex.courts) {
      const courtSlots = new Array(totalSlots).fill(true);
      for (const booking of court.bookings) {
        const startIdx =
          (booking.startTime * 60 +
            (booking.startMinute || 0) -
            openHour * 60) /
          timeGridInterval;
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
    let currentTime = openHour * 60;
    const closingTime = closeHour * 60;

    while (currentTime < closingTime) {
      if (isToday && currentTime < currentTimeInMinutes) {
        currentTime += timeGridInterval;
        continue;
      }

      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      
      // Aquí se genera el string "real" (ej: "27:00") que el frontend espera
      const timeString = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      const courtStatuses = complex.courts.map((court) => {
        const slotsNeeded = court.slotDurationMinutes / timeGridInterval;
        const currentSlotIndex =
          (currentTime - openHour * 60) / timeGridInterval;

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