import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { Prisma, PriceRule, Schedule } from "@prisma/client";
import { z } from "zod";
import { endOfDay, getDay, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";

const searchSchema = z.object({
  city: z.string().optional(),
  sport: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

type ComplexWithCourtsAndBookings = Prisma.ComplexGetPayload<{
  include: {
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
  timeString: string
): PriceRule | undefined {
  if (!court.priceRules || court.priceRules.length === 0) return undefined;
  const [hour] = timeString.split(":").map(Number);
  const rule = court.priceRules.find(
    (r) => hour >= r.startTime && hour < r.endTime
  );
  return rule || court.priceRules[0];
}

function findNextAvailableSlots(
  complex: ComplexWithCourtsAndBookings,
  searchDate: Date,
  count: number = 3
): AvailableSlot[] {
  // FIX: Usar zona horaria consistente
  const now = toZonedTime(new Date(), TIMEZONE);
  const zonedSearchDate = toZonedTime(searchDate, TIMEZONE);
  
  const isToday =
    now.getFullYear() === zonedSearchDate.getFullYear() &&
    now.getMonth() === zonedSearchDate.getMonth() &&
    now.getDate() === zonedSearchDate.getDate();

  const dayOfWeek = getDay(zonedSearchDate);
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
  const openHourForDay = schedule[openKey] as number | null;
  const closeHourForDay = schedule[closeKey] as number | null;

  if (openHourForDay == null || closeHourForDay == null) {
    return [];
  }

  const openHour = openHourForDay;
  const closeHour = closeHourForDay;

  const bookedSlotsByCourtId = new Map<string, Set<string>>();
  complex.courts.forEach((court) => {
    const bookedTimes = new Set<string>();
    if (court.bookings) {
      court.bookings.forEach((booking) => {
        const timeString = `${String(booking.startTime).padStart(
          2,
          "0"
        )}:${String(booking.startMinute || 0).padStart(2, "0")}`;
        bookedTimes.add(timeString);
      });
    }
    bookedSlotsByCourtId.set(court.id, bookedTimes);
  });

  const availableSlots: AvailableSlot[] = [];
  
  // FIX: Calcular la hora actual en minutos para comparación precisa
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  const startHour = isToday ? Math.max(now.getHours(), openHour) : openHour;
  const timeInterval = complex.timeSlotInterval || 30;

  for (let hour = startHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += timeInterval) {
      if (availableSlots.length >= count) return availableSlots;

      const slotTimeInMinutes = hour * 60 + minute;
      
      // FIX: Comparación simplificada y correcta para horarios pasados
      if (isToday && slotTimeInMinutes < currentTimeInMinutes) {
        continue;
      }

      const timeString = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      for (const court of complex.courts) {
        if (availableSlots.length >= count) break;

        const courtBookedSlots = bookedSlotsByCourtId.get(court.id);
        if (!courtBookedSlots?.has(timeString)) {
          const priceRule = getPriceRuleForTime(court, timeString);
          if (!priceRule) continue;

          const cleanCourtData: CourtInfo = {
            id: court.id,
            name: court.name,
            slotDurationMinutes: court.slotDurationMinutes,
            price: priceRule.price,
            depositAmount: priceRule.depositAmount,
            priceRules: court.priceRules,
          };

          availableSlots.push({ time: timeString, court: cleanCourtData });
        }
      }
    }
    if (availableSlots.length >= count) break;
  }

  return availableSlots;
}

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

    // FIX: Parsear fecha con zona horaria consistente
    const searchDate = date ? toZonedTime(`${date}T00:00:00`, TIMEZONE) : null;

    const whereClause: Prisma.ComplexWhereInput = {
      onboardingCompleted: true,
      city: city ? { contains: city, mode: "insensitive" } : undefined,
    };

    const complexes = await db.complex.findMany({
      where: whereClause,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        schedule: true,
        courts: {
          where: {
            sport: sport ? { slug: sport } : undefined,
          },
          include: {
            bookings: searchDate
              ? {
                  where: {
                    date: {
                      gte: startOfDay(searchDate),
                      lt: endOfDay(searchDate),
                    },
                  },
                }
              : false,
            priceRules: true,
          },
        },
      },
    });

    const filteredComplexes = complexes.filter((c) => c.courts.length > 0);

    const formattedComplexes = filteredComplexes
      .map((complex) => {
        const availableSlots = searchDate
          ? findNextAvailableSlots(
              complex as unknown as ComplexWithCourtsAndBookings,
              searchDate,
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

        if (!searchDate) {
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