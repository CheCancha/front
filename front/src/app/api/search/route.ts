import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { Prisma, Court } from "@prisma/client";
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
      };
    };
  };
}>;

type AvailableSlot = {
  time: string;
  court: Court;
};

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

  const openHour = complex.schedule?.[`${key}Open`] ?? complex.openHour ?? 9;
  const closeHour =
    complex.schedule?.[`${key}Close`] ?? complex.closeHour ?? 23;

  // 1. Crear un mapa de horarios ya reservados para cada cancha para una búsqueda rápida
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

  // 2. Iterar desde la hora actual (si es hoy) para encontrar turnos libres
  const availableSlots: AvailableSlot[] = [];
  const startHour = isToday ? now.getHours() : openHour;

  for (let hour = startHour; hour < closeHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
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
        const courtBookedSlots = bookedSlotsByCourtId.get(court.id);
        if (!courtBookedSlots?.has(timeString)) {
          availableSlots.push({ time: timeString, court });

          if (availableSlots.length >= count) {
            return availableSlots;
          }
        }
      }
    }
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

    const { city, sport, date, time } = validation.data;
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

    const formattedComplexes = filteredComplexes.map((complex) => {
      const availableSlots = findNextAvailableSlots(complex, searchDate, 3);

      return {
        id: complex.id,
        name: complex.name,
        address: `${complex.address}, ${complex.city}`,
        imageUrl: complex.images[0]?.url || "/placeholder.jpg",
        availableSlots: availableSlots,
      };
    });

    return NextResponse.json(formattedComplexes);
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
