import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { Prisma, PriceRule } from "@prisma/client";
import { z } from "zod";
import { getDay } from "date-fns";

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
  const now = new Date();
  const isToday = now.toDateString() === searchDate.toDateString();

  const dayOfWeek = getDay(searchDate);
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const key = dayKeys[dayOfWeek] as keyof typeof complex.schedule;

  const openHourForDay = complex.schedule?.[`${key}Open`];
  const closeHourForDay = complex.schedule?.[`${key}Close`];

  // 2. ¡Esta es la validación clave! Si no hay hora de apertura o cierre, está cerrado.
  if (openHourForDay == null || closeHourForDay == null) {
    // 3. Si está cerrado, devolvemos un array vacío INMEDIATAMENTE.
    return [];
  }

  // Si llegamos aquí, el club está abierto. Usamos los horarios del día.
  const openHour = openHourForDay;
  const closeHour = closeHourForDay;

  const bookedSlotsByCourtId = new Map<string, Set<string>>();
  complex.courts.forEach((court) => {
    const bookedTimes = new Set<string>();
    court.bookings.forEach((booking) => {
      const timeString = `${String(booking.startTime).padStart(
        2,
        "0"
      )}:${String(booking.startMinute || 0).padStart(2, "0")}`;
      bookedTimes.add(timeString);
    });
    bookedSlotsByCourtId.set(court.id, bookedTimes);
  });

  const availableSlots: AvailableSlot[] = [];

  // --- LÓGICA CORREGIDA ---
  // La hora de inicio es la más tardía entre la hora actual (si es hoy) y la hora de apertura del club.
  const startHour = isToday ? Math.max(now.getHours(), openHour) : openHour;

  for (let hour = startHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (availableSlots.length >= count) return availableSlots;

      const timeString = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      if (
        isToday &&
        (hour < now.getHours() ||
          (hour === now.getHours() && minute < now.getMinutes()))
      ) {
        continue;
      }

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
    const searchDate = new Date(
      `${date || new Date().toISOString().split("T")[0]}T00:00:00.000-03:00`
    );

    const whereClause: Prisma.ComplexWhereInput = {
      onboardingCompleted: true,
    };
    if (city) {
      whereClause.city = { contains: city, mode: "insensitive" };
    }

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
            bookings: {
              where: { date: searchDate },
            },
            priceRules: true,
          },
        },
      },
    });

    const filteredComplexes = complexes.filter((c) => c.courts.length > 0);

    const formattedComplexes = filteredComplexes
      .map((complex) => {
        const availableSlots = findNextAvailableSlots(complex, searchDate, 3);
        return {
          id: complex.id,
          name: complex.name,
          address: `${complex.address}, ${complex.city}`,
          imageUrl: complex.images[0]?.url || "/placeholder.jpg",
          availableSlots: availableSlots,
        };
      })
      .filter((complex) => complex.availableSlots.length > 0);

    return NextResponse.json(formattedComplexes);
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
