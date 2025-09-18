// front/src/app/api/complex/[id]/slots/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";


function generateTimeSlots(
  openHour: number,
  closeHour: number,
  slotDurationMinutes: number
): Array<{ time: string; hour: number; minute: number }> {
  const slots = [];
  let currentHour = openHour;
  let currentMinute = 0;

  // Itera mientras la hora actual sea menor que la hora de cierre
  while (currentHour < closeHour) {
    const timeString = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinute
    ).padStart(2, "0")}`;

    slots.push({
      time: timeString,
      hour: currentHour,
      minute: currentMinute,
    });

    // Calcula el siguiente slot
    const totalMinutes = currentHour * 60 + currentMinute + slotDurationMinutes;
    currentHour = Math.floor(totalMinutes / 60);
    currentMinute = totalMinutes % 60;

    // Si el siguiente slot empieza en o después de la hora de cierre, paramos.
    if (currentHour >= closeHour) {
      break;
    }
  }
  return slots;
}


// Endpoint: GET /api/complex/[id]/slots?date=YYYY-MM-DD
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
        { error: "El parámetro 'date' es obligatorio (formato: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const requestedDate = new Date(dateString);
    // getDay() devuelve 0 para Domingo, 1 para Lunes, etc.
    const dayOfWeek = requestedDate.getUTCDay();

    // 1. Traemos el complejo y su horario específico (schedule)
     const complex = await db.complex.findUnique({
      where: { id: id },
      include: { schedule: true },
    });

    if (!complex) {
      return NextResponse.json(
        { error: "Complejo no encontrado" },
        { status: 404 }
      );
    }

    // 2. Manejo de Nulos: Establecemos valores por defecto si no están en la DB
    const slotDuration = complex.slotDurationMinutes ?? 60; // Default: 60 minutos
    const defaultOpenHour = complex.openHour ?? 9; // Default: 09:00
    const defaultCloseHour = complex.closeHour ?? 23; // Default: 23:00

    // 3. Lógica dinámica para obtener el horario del día de la semana solicitado
    let effectiveOpenHour = defaultOpenHour;
    let effectiveCloseHour = defaultCloseHour;

    if (complex.schedule) {
      switch (dayOfWeek) {
        case 0: // Domingo
          effectiveOpenHour = complex.schedule.sundayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.sundayClose ?? defaultCloseHour;
          break;
        case 1: // Lunes
          effectiveOpenHour = complex.schedule.mondayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.mondayClose ?? defaultCloseHour;
          break;
        case 2: // Martes
          effectiveOpenHour = complex.schedule.tuesdayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.tuesdayClose ?? defaultCloseHour;
          break;
        case 3: // Miércoles
          effectiveOpenHour = complex.schedule.wednesdayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.wednesdayClose ?? defaultCloseHour;
          break;
        case 4: // Jueves
          effectiveOpenHour = complex.schedule.thursdayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.thursdayClose ?? defaultCloseHour;
          break;
        case 5: // Viernes
          effectiveOpenHour = complex.schedule.fridayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.fridayClose ?? defaultCloseHour;
          break;
        case 6: // Sábado
          effectiveOpenHour = complex.schedule.saturdayOpen ?? defaultOpenHour;
          effectiveCloseHour = complex.schedule.saturdayClose ?? defaultCloseHour;
          break;
      }
    }

    // 4. Generamos los slots con los valores ya validados y seguros
    const slots = generateTimeSlots(
      effectiveOpenHour,
      effectiveCloseHour,
      slotDuration
    );

    return NextResponse.json({
        slots: slots,
        meta: {
            date: dateString,
            dayOfWeek: dayOfWeek,
            totalSlots: slots.length,
            slotDurationMinutes: slotDuration,
            effectiveHours: {
                open: effectiveOpenHour,
                close: effectiveCloseHour,
            },
        },
    });

  } catch (error) {
    console.error("Error al generar slots:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al generar slots" },
      { status: 500 }
    );
  }
}