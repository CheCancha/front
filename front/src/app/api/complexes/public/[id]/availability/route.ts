import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getDay } from "date-fns";

const TIME_GRID_INTERVAL = 30;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; 
    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("date");

    if (!dateString) {
      return NextResponse.json(
        { error: "El parámetro 'date' es obligatorio" },
        { status: 400 }
      );
    }
    const requestedDate = new Date(`${dateString}T00:00:00.000-03:00`);

    const complex = await db.complex.findUnique({
      where: { id: id },
      include: {
        schedule: true,
        courts: { include: { bookings: { where: { date: requestedDate } } } },
      },
    });

    if (!complex) {
      return NextResponse.json(
        { error: "Complejo no encontrado" },
        { status: 404 }
      );
    }

    const dayOfWeek = getDay(requestedDate);
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

let openHour: number | null | undefined;
let closeHour: number | null | undefined;

if (complex.schedule) {
  const rawOpenHour = complex.schedule[`${key}Open` as keyof typeof complex.schedule];
  const rawCloseHour = complex.schedule[`${key}Close` as keyof typeof complex.schedule];
  openHour = typeof rawOpenHour === "string" ? Number(rawOpenHour) : rawOpenHour;
  closeHour = typeof rawCloseHour === "string" ? Number(rawCloseHour) : rawCloseHour;
} else {
  // Si no hay cronograma específico, usamos los horarios generales del club como respaldo.
  openHour = complex.openHour;
  closeHour = complex.closeHour;
}

if (typeof openHour !== "number" || typeof closeHour !== "number") {
  return NextResponse.json([]); // Devuelve un array vacío para indicar que no hay turnos.
}

    // --- LÓGICA DE DISPONIBILIDAD MEJORADA ---

    // 1. Crear un mapa de disponibilidad para cada cancha (más eficiente)
    const availabilityMap = new Map<string, boolean[]>();
    const totalSlots = (closeHour - openHour) * (60 / TIME_GRID_INTERVAL);

    for (const court of complex.courts) {
      const courtSlots = new Array(totalSlots).fill(true);
      for (const booking of court.bookings) {
        const startIdx =
          (booking.startTime * 60 +
            (booking.startMinute || 0) -
            openHour * 60) /
          TIME_GRID_INTERVAL;
        const slotsToBook = court.slotDurationMinutes / TIME_GRID_INTERVAL;
        for (let i = 0; i < slotsToBook; i++) {
          if (startIdx + i < totalSlots) {
            courtSlots[startIdx + i] = false;
          }
        }
      }
      availabilityMap.set(court.id, courtSlots);
    }

    // 2. Determinar los horarios de inicio VÁLIDOS para cada cancha
    const validStartTimes: {
      time: string;
      courts: { courtId: string; available: boolean }[];
    }[] = [];
    let currentTime = openHour * 60;
    const closingTime = closeHour * 60;

    while (currentTime < closingTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      const courtStatuses = complex.courts.map((court) => {
        const slotsNeeded = court.slotDurationMinutes / TIME_GRID_INTERVAL;
        const currentSlotIndex =
          (currentTime - openHour * 60) / TIME_GRID_INTERVAL;

        let canBook = true;
        for (let i = 0; i < slotsNeeded; i++) {
          if (!availabilityMap.get(court.id)?.[currentSlotIndex + i]) {
            canBook = false;
            break;
          }
        }
        return { courtId: court.id, available: canBook };
      });

      validStartTimes.push({ time: timeString, courts: courtStatuses });
      currentTime += TIME_GRID_INTERVAL;
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
