import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getDay } from "date-fns";
import { BookingStatus } from "@prisma/client";

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
    const requestedDate = new Date(`${dateString}T00:00:00`);

    const complex = await db.complex.findUnique({
      where: { slug: slug },
      include: {
        schedule: true,
        courts: {
          include: {
            bookings: {
              where: {
                date: requestedDate,
                status: { not: BookingStatus.CANCELADO },
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

    // --- CORRECCIÓN CLAVE ---
    // La grilla de horarios ahora respeta la configuración del manager.
    const timeGridInterval = complex.timeSlotInterval;

    const dayOfWeek = getDay(requestedDate);
    const dayKeys = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ];
    const key = dayKeys[dayOfWeek];

    let openHour: number | null | undefined;
    let closeHour: number | null | undefined;

    if (complex.schedule) {
      const rawOpenHour = complex.schedule[`${key}Open` as keyof typeof complex.schedule];
      const rawCloseHour = complex.schedule[`${key}Close` as keyof typeof complex.schedule];
      openHour = typeof rawOpenHour === "number" ? rawOpenHour : undefined;
      closeHour = typeof rawCloseHour === "number" ? rawCloseHour : undefined;
    }
    
    if (openHour === undefined) openHour = complex.openHour;
    if (closeHour === undefined) closeHour = complex.closeHour;

    if (typeof openHour !== "number" || typeof closeHour !== "number") {
      return NextResponse.json([]);
    }

    // --- LÓGICA DE DISPONIBILIDAD ACTUALIZADA ---
    const availabilityMap = new Map<string, boolean[]>();
    const totalSlots = (closeHour - openHour) * (60 / timeGridInterval);

    for (const court of complex.courts) {
      const courtSlots = new Array(totalSlots).fill(true);
      for (const booking of court.bookings) {
        const startIdx = (booking.startTime * 60 + (booking.startMinute || 0) - openHour * 60) / timeGridInterval;
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
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      const courtStatuses = complex.courts.map((court) => {
        const slotsNeeded = court.slotDurationMinutes / timeGridInterval;
        const currentSlotIndex = (currentTime - openHour * 60) / timeGridInterval;

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