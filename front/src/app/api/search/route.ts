import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { Prisma, Sport } from "@prisma/client";
import { z } from "zod";

// Esquema de validación para los parámetros de búsqueda
const searchSchema = z.object({
  city: z.string().optional(),
  sport: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

type ComplexWithSchedule = {
  schedule?: {
    sundayOpen?: number | null;
    sundayClose?: number | null;
    mondayOpen?: number | null;
    mondayClose?: number | null;
    tuesdayOpen?: number | null;
    tuesdayClose?: number | null;
    wednesdayOpen?: number | null;
    wednesdayClose?: number | null;
    thursdayOpen?: number | null;
    thursdayClose?: number | null;
    fridayOpen?: number | null;
    fridayClose?: number | null;
    saturdayOpen?: number | null;
    saturdayClose?: number | null;
  } | null;
  openHour: number | null;
  closeHour: number | null;
  slotDurationMinutes: number | null;
  courts: Array<{
    bookings: Array<{
      startTime: number;
    }>;
  }>;
};

function getNextAvailableSlots(
  complex: ComplexWithSchedule,
  count: number = 3
): string[] {
  const now = new Date();
  now.setHours(now.getUTCHours() - 3);

  const currentHour = now.getHours();
  const dayIndex = now.getDay(); // 0=Dom, 1=Lun, ...

  const dayMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayKey = dayMap[dayIndex];

  const openHour =
    complex.schedule?.[`${todayKey}Open` as keyof typeof complex.schedule] ??
    complex.openHour;
  const closeHour =
    complex.schedule?.[`${todayKey}Close` as keyof typeof complex.schedule] ??
    complex.closeHour;
  const { slotDurationMinutes, courts } = complex;

  if (
    openHour === null ||
    closeHour === null ||
    !slotDurationMinutes ||
    !courts ||
    courts.length === 0
  ) {
    return [];
  }

  // Agrupamos todas las reservas de hoy para saber cuántas hay en cada horario
  const bookingsCountByHour: { [hour: number]: number } = {};
  courts.forEach((court) => {
    court.bookings.forEach((booking) => {
      bookingsCountByHour[booking.startTime] =
        (bookingsCountByHour[booking.startTime] || 0) + 1;
    });
  });

  const availableSlots: string[] = [];

  // Iteramos por los posibles horarios del día, empezando desde la hora actual
  for (let hour = currentHour; hour < closeHour; hour++) {
    // Solo consideramos los minutos si la hora es la actual
    const startMinute =
      hour === currentHour
        ? Math.ceil(now.getMinutes() / slotDurationMinutes) *
          slotDurationMinutes
        : 0;

    for (let minute = startMinute; minute < 60; minute += slotDurationMinutes) {
      const totalBookingsForSlot = bookingsCountByHour[hour] || 0;

      // Si hay menos reservas que canchas, significa que hay al menos una disponible
      if (totalBookingsForSlot < courts.length) {
        const timeString = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        availableSlots.push(timeString);
        // Si ya encontramos los 3 que necesitábamos, terminamos        {activeSection === "requests" && <AdminDashboard />}

        if (availableSlots.length === count) {
          return availableSlots;
        }
      }
    }
  }

  return availableSlots;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const query: { [key: string]: string | undefined } = {};
    if (searchParams.has("city"))
      query.city = searchParams.get("city") ?? undefined;
    if (searchParams.has("sport"))
      query.sport = searchParams.get("sport") ?? undefined;
    if (searchParams.has("date"))
      query.date = searchParams.get("date") ?? undefined;
    if (searchParams.has("time"))
      query.time = searchParams.get("time") ?? undefined;

    const validation = searchSchema.safeParse(query);
    if (!validation.success) {
      return new NextResponse(validation.error.issues[0].message, {
        status: 400,
      });
    }

    const { city, sport, date, time } = validation.data;

    const whereClause: Prisma.ComplexWhereInput = {
      onboardingCompleted: true, // Solo mostrar complejos activos
    };

    // --- Construcción de la cláusula de búsqueda ---

    if (city) {
      whereClause.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    // El filtro de canchas ('courts') es el más complejo y lo construiremos por partes
    const courtFilter: Prisma.CourtWhereInput = {};

    if (sport) {
        courtFilter.sport = { slug: sport };
    }

    if (date && time) {
        const bookingDate = new Date(`${date}T00:00:00.000-03:00`);
        const [hour, minute] = time.split(':').map(Number);

        // Buscamos canchas que NO tengan ('none') una reserva en ese horario exacto.
        courtFilter.bookings = {
            none: {
                date: bookingDate,
                startTime: hour,
                startMinute: minute,
                status: { in: ["CONFIRMADO", "PENDIENTE"] },
            },
        };
    }

    if (Object.keys(courtFilter).length > 0) {
        whereClause.courts = {
            some: courtFilter,
        };
    }


    // const now = new Date();
    // const startOfToday = new Date(
    //   now.getFullYear(),
    //   now.getMonth(),
    //   now.getDate()
    // );
    // const startOfTomorrow = new Date(startOfToday);
    // startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const complexes = await db.complex.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    const formattedComplexes = complexes.map((complex) => ({
      id: complex.id,
      name: complex.name,
      address: `${complex.address}, ${complex.city}`,
      imageUrl: complex.images[0]?.url || "/placeholder.jpg",
      availableSlots: [time || 'Disponible'], 
    }));

    return NextResponse.json(formattedComplexes);
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
