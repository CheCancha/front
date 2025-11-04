import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { z } from "zod";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { checkOnboarding } from "@/shared/lib/checkOnboarding";

// Esquema para validar el payload de entrada
const settingsSchema = z.object({
  schedule: z
    .object({
      mondayOpen: z.string().nullable().optional(),
      mondayClose: z.string().nullable().optional(),
      tuesdayOpen: z.string().nullable().optional(),
      tuesdayClose: z.string().nullable().optional(),
      wednesdayOpen: z.string().nullable().optional(),
      wednesdayClose: z.string().nullable().optional(),
      thursdayOpen: z.string().nullable().optional(),
      thursdayClose: z.string().nullable().optional(),
      fridayOpen: z.string().nullable().optional(),
      fridayClose: z.string().nullable().optional(),
      saturdayOpen: z.string().nullable().optional(),
      saturdayClose: z.string().nullable().optional(),
      sundayOpen: z.string().nullable().optional(),
      sundayClose: z.string().nullable().optional(),
    })
    .optional(),
  timeSlotInterval: z.literal(30).or(z.literal(60)).or(z.literal(90)).optional(),
});

// --- 1. AÑADÍ ESTA FUNCIÓN GET ---
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Reutilizamos tu lógica de autorización
    const { error } = await authorizeAndVerify(id);
    if (error) return error;

    // Buscamos solo la data que necesita el formulario de Abonos
    const complexConfig = await db.complex.findUnique({
      where: { id },
      select: {
        timeSlotInterval: true, // El intervalo (30, 60, 90)
        schedule: true,         // El objeto de horarios (mondayOpen, etc.)
      },
    });

    if (!complexConfig) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    // Devolvemos la configuración
    return NextResponse.json({
      schedule: complexConfig.schedule,
      timeSlotInterval: complexConfig.timeSlotInterval,
    });

  } catch (error) {
    console.error("[SETTINGS_SCHEDULE_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { error } = await authorizeAndVerify(id);
    if (error) return error;

    const body = await req.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const { schedule, timeSlotInterval } = validation.data;

    const updatePromises = [];

    if (timeSlotInterval !== undefined) {
      updatePromises.push(
        db.complex.update({
          where: { id },
          data: { timeSlotInterval },
        })
      );
    }

    if (schedule) {
      updatePromises.push(
        db.schedule.upsert({
          where: { complexId: id },
          update: schedule,
          create: { complexId: id, ...schedule },
        })
      );
    }

    await Promise.all(updatePromises);

    // --- 2. LLAMAR A LA FUNCIÓN DE VERIFICACIÓN ---
    await checkOnboarding(id);

    return NextResponse.json({ message: "Ajustes de horarios actualizados" });
  } catch (error) {
    console.error("[SETTINGS_SCHEDULE_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}