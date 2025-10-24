import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { Prisma, PriceRule, Schedule } from "@prisma/client";
import { z } from "zod";
import { addDays, getDay } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

const searchSchema = z.object({
  city: z.string().optional(),
  sport: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

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
  const currentHour = Number(formatInTimeZone(now, ARGENTINA_TIME_ZONE, "H"));
  const currentMinute = Number(formatInTimeZone(now, ARGENTINA_TIME_ZONE, "m"));
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const isToday =
    formatInTimeZone(searchDate, ARGENTINA_TIME_ZONE, "yyyy-MM-dd") ===
    formatInTimeZone(now, ARGENTINA_TIME_ZONE, "yyyy-MM-dd");

  const dayOfWeek = getDay(searchDate);
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

  const timeInterval = complex.timeSlotInterval || 30; // Intervalo base (e.g., 30 mins)
  const totalSlotsInDay = (closeHour - openHour) * (60 / timeInterval);
  const availableSlots: AvailableSlot[] = [];

  const availabilityMap = new Map<string, boolean[]>();
  complex.courts.forEach((court) => {
    const courtSlots = new Array(totalSlotsInDay).fill(true); // Todos empiezan libres
    
    // Marcar los slots ocupados por reservas CONFIRMADAS o PENDIENTES recientes
    court.bookings?.forEach((booking) => {
      // Filtrar por status si es necesario (ya lo hace la query de Prisma ahora)
      
      const startIdx =
        (booking.startTime * 60 +
          (booking.startMinute || 0) -
          openHour * 60) /
        timeInterval;
      
      // Determinar cuántos slots de 'timeInterval' ocupa esta reserva
      const slotsToBook = court.slotDurationMinutes / timeInterval; 
      
      for (let i = 0; i < slotsToBook; i++) {
        const slotIndex = Math.floor(startIdx + i); // Asegurarse de que sea entero
        if (slotIndex >= 0 && slotIndex < totalSlotsInDay) {
          courtSlots[slotIndex] = false; // Marcar como ocupado
        }
      }
    });
    availabilityMap.set(court.id, courtSlots);
  });

  // 2. Encontrar los próximos 'count' slots disponibles
  const availableSlotsResult: AvailableSlot[] = [];
  
  // Calcular minuto inicial (como antes)
  const startTimeInMinutes = isToday 
    ? Math.max(
        openHour * 60,
        // Redondear hacia ARRIBA al próximo intervalo
        Math.ceil(currentTimeInMinutes / timeInterval) * timeInterval 
      )
    : openHour * 60;
    
  const closingTimeInMinutes = closeHour * 60;

  // Iterar por cada POSIBLE slot de inicio
  for (let timeInMinutes = startTimeInMinutes; timeInMinutes < closingTimeInMinutes; timeInMinutes += timeInterval) {
    if (availableSlotsResult.length >= count) break; // Ya encontramos los que necesitamos

    const hour = Math.floor(timeInMinutes / 60);
    const minute = timeInMinutes % 60;
    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Revisar cada cancha para ver si está libre en ESTE slot
    for (const court of complex.courts) {
      if (availableSlotsResult.length >= count) break; // Salir si ya llenamos

      const courtAvailability = availabilityMap.get(court.id);
      if (!courtAvailability) continue;

      // Calcular cuántos slots necesita esta cancha y el índice actual
      const slotsNeeded = court.slotDurationMinutes / timeInterval;
      const currentSlotIndex = (timeInMinutes - openHour * 60) / timeInterval;

      // Verificar si hay suficientes slots CONSECUTIVOS libres
      let canBook = true;
      if (timeInMinutes + court.slotDurationMinutes > closingTimeInMinutes) {
          canBook = false; 
      } else {
          for (let i = 0; i < slotsNeeded; i++) {
              const slotIndexToCheck = Math.floor(currentSlotIndex + i);
              if (slotIndexToCheck >= totalSlotsInDay || !courtAvailability[slotIndexToCheck]) {
                  canBook = false;
                  break; 
              }
          }
      }
      
      if (canBook) {
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

        if (!availableSlotsResult.some(s => s.time === timeString && s.court.id === court.id)) {
            availableSlotsResult.push({ time: timeString, court: cleanCourtData });
        }
      }
    } 
  } 

  return availableSlotsResult.slice(0, count);
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

    const bookingsInclude = searchDateStart
      ? {
          where: {
            date: {
              gte: searchDateStart,
              lt: addDays(searchDateStart, 1),
            },
          },
        }
      : true;

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
                  status: { in: ["CONFIRMADO", "PENDIENTE"] } 
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
