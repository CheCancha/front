import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { Prisma, PriceRule, Schedule } from "@prisma/client";
import { z } from "zod";
import { addDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  city: z.string().optional(),
  sport: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

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

type ComplexWithCourtsAndBookings = Prisma.ComplexGetPayload<{
  include: {
    images: true;
    schedule: true;
    courts: {
      include: {
        bookings: true;
        priceRules: true;
      };
    };
  };
}>;

type CourtInfo = {
  id: string;
  name: string;
  slotDurationMinutes: number;
  price: number;
  depositAmount: number;
  priceRules: PriceRule[];
};

type AvailableSlot = {
  time: string;
  court: CourtInfo;
};

function getPriceRuleForTime(
  court: { priceRules: PriceRule[] },
  timeInMinutes: number // <-- Ahora recibe minutos (ej: 750)
): PriceRule | { price: number; depositAmount: number } {
  if (court.priceRules && court.priceRules.length > 0) {
    const rule = court.priceRules.find(
      (r) => timeInMinutes >= r.startTime && timeInMinutes < r.endTime // ej: 750 >= 750
    );

    if (rule) {
      return rule;
    }
  }

  console.warn(
    `  -> [getPriceRuleForTime] No se encontró regla para ${timeInMinutes} (min). Devolviendo precio 0.`
  );
  return { price: 0, depositAmount: 0 };
}

function findNextAvailableSlots(
  complex: ComplexWithCourtsAndBookings,
  searchDate: Date,
  count: number = 3
): AvailableSlot[] {
  const now = new Date();
  const currentHour = Number(formatInTimeZone(now, ARGENTINA_TIME_ZONE, "H"));
  const currentMinute = Number(formatInTimeZone(now, ARGENTINA_TIME_ZONE, "m"));
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const isToday =
    formatInTimeZone(searchDate, ARGENTINA_TIME_ZONE, "yyyy-MM-dd") ===
    formatInTimeZone(now, ARGENTINA_TIME_ZONE, "yyyy-MM-dd");

  const isoDayOfWeek = Number(
    formatInTimeZone(searchDate, ARGENTINA_TIME_ZONE, "i")
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
  ] as const;
  const key = dayKeys[dayOfWeek];

  const schedule = complex.schedule;
  if (!schedule) return [];

  const openKey = `${key}Open` as keyof Schedule;
  const closeKey = `${key}Close` as keyof Schedule;

  // Leemos "12:30" y lo convertimos a 750
  const openMinutes = parseMinutesFromString(schedule[openKey] as string | null);
  let closeMinutes = parseMinutesFromString(
    schedule[closeKey] as string | null
  );

  // Fallback si no hay horario
  if (openMinutes == null || closeMinutes == null) {
    console.warn(`[${complex.name}] Día cerrado, no hay horarios.`);
    return [];
  }

  // Lógica de transnoche
  if (closeMinutes < openMinutes) {
    closeMinutes += 1440; // ej: 180 (3:00) + 1440 = 1620 (27:00)
  }

  const timeInterval = complex.timeSlotInterval || 30;
  const totalSlotsInDay = Math.floor(
    (closeMinutes - openMinutes) / timeInterval
  );

  if (totalSlotsInDay <= 0) {
    console.warn(`[${complex.name}] TotalSlots es 0 o negativo.`);
    return [];
  }

  const availabilityMap = new Map<string, boolean[]>();
  complex.courts.forEach((court) => {
    const courtSlots = new Array(totalSlotsInDay).fill(true);

    court.bookings?.forEach((booking) => {
      // 'startTime' y 'startMinute' de la BD (ej: 12 y 30)
      const bookingStartMinutes =
        booking.startTime * 60 + (booking.startMinute || 0);

      const startIdx = (bookingStartMinutes - openMinutes) / timeInterval;
      const slotsToBook = court.slotDurationMinutes / timeInterval;

      for (let i = 0; i < slotsToBook; i++) {
        const slotIndex = Math.floor(startIdx + i);
        if (slotIndex >= 0 && slotIndex < totalSlotsInDay) {
          courtSlots[slotIndex] = false;
        }
      }
    });
    availabilityMap.set(court.id, courtSlots);
  });

  const availableSlotsResult: AvailableSlot[] = [];

  // Calcular minuto inicial (como antes)
  const startTimeInMinutes = isToday
    ? Math.max(
        openMinutes,
        Math.ceil(currentTimeInMinutes / timeInterval) * timeInterval
      )
    : openMinutes;

  const closingTimeInMinutes = closeMinutes;

  for (
    let timeInMinutes = startTimeInMinutes;
    timeInMinutes < closingTimeInMinutes;
    timeInMinutes += timeInterval
  ) {
    if (availableSlotsResult.length >= count) break;

    const hour = Math.floor(timeInMinutes / 60);
    const minute = timeInMinutes % 60;
    const timeString = `${String(hour).padStart(2, "0")}:${String(
      minute
    ).padStart(2, "0")}`; // "12:30"

    for (const court of complex.courts) {
      if (availableSlotsResult.length >= count) break;

      const courtAvailability = availabilityMap.get(court.id);
      if (!courtAvailability) continue;

      const slotsNeeded = court.slotDurationMinutes / timeInterval;
      const currentSlotIndex = (timeInMinutes - openMinutes) / timeInterval;

      let canBook = true;
      if (timeInMinutes + court.slotDurationMinutes > closingTimeInMinutes) {
        canBook = false;
      } else {
        for (let i = 0; i < slotsNeeded; i++) {
          const slotIndexToCheck = Math.floor(currentSlotIndex + i);
          if (
            slotIndexToCheck >= totalSlotsInDay ||
            !courtAvailability[slotIndexToCheck]
          ) {
            canBook = false;
            break;
          }
        }
      }

      if (canBook) {
        const priceRule = getPriceRuleForTime(court, timeInMinutes);

        if (!priceRule || priceRule.price <= 0) {
          continue;
        }

        const cleanCourtData: CourtInfo = {
          id: court.id,
          name: court.name,
          slotDurationMinutes: court.slotDurationMinutes,
          price: priceRule.price,
          depositAmount: priceRule.depositAmount,
          priceRules: court.priceRules,
        };

        if (
          !availableSlotsResult.some(
            (s) => s.time === timeString && s.court.id === court.id
          )
        ) {
          availableSlotsResult.push({
            time: timeString,
            court: cleanCourtData,
          });
        }
      }
    }
  }
  return availableSlotsResult;
}

// --- Recuerda corregir la consulta de Prisma en GET para filtrar bookings ---
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());

    const validation = searchSchema.safeParse(query);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { city, sport, date } = validation.data;

    const searchDateStart = date
      ? toDate(`${date}T00:00:00`, { timeZone: ARGENTINA_TIME_ZONE })
      : null;

    const whereClause: Prisma.ComplexWhereInput = {
      onboardingCompleted: true,
      city: city ? { contains: city, mode: "insensitive" } : undefined,
    };

    const complexes = (await db.complex.findMany({
      where: whereClause,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        schedule: true,
        courts: {
          where: {
            sport: sport ? { slug: sport } : undefined,
          },
          include: {
            bookings: searchDateStart
              ? {
                  where: {
                    date: {
                      gte: searchDateStart,
                      lt: addDays(searchDateStart, 1),
                    },
                    status: { in: ["CONFIRMADO", "PENDIENTE"] },
                  },
                }
              : false,
            priceRules: true,
          },
        },
      },
    })) as ComplexWithCourtsAndBookings[];

    const filteredComplexes = complexes.filter((c) => c.courts.length > 0);

    const formattedComplexes = filteredComplexes
      .map((complex) => {
        const availableSlots = searchDateStart
          ? findNextAvailableSlots(
              complex as unknown as ComplexWithCourtsAndBookings,
              searchDateStart,
              3
            )
          : [];
        const baseComplexData = {
          id: complex.id,
          slug: complex.slug,
          name: complex.name,
          address: `${complex.address}, ${complex.city}`,
          imageUrl: complex.images[0]?.url || "/placeholder.jpg",
          latitude: complex.latitude,
          longitude: complex.longitude,
          cancellationPolicyHours: complex.cancellationPolicyHours,
          averageRating: complex.averageRating,
          reviewCount: complex.reviewCount,
        };

        if (!searchDateStart) {
          return {
            ...baseComplexData,
            availableSlots: [],
          };
        }
        if (availableSlots.length === 0) {
          return {
            ...baseComplexData,
            availableSlots: [],
          };
        }

        return {
          ...baseComplexData,
          availableSlots: availableSlots,
        };
      })
      .filter(Boolean);

    return NextResponse.json(formattedComplexes);
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
