import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { z } from "zod";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { checkOnboarding } from "@/shared/lib/checkOnboarding";

// Esquema para validar el payload de entrada
const settingsSchema = z.object({
  schedule: z
    .object({
      mondayOpen: z.number().nullable().optional(),
      mondayClose: z.number().nullable().optional(),
      tuesdayOpen: z.number().nullable().optional(),
      tuesdayClose: z.number().nullable().optional(),
      wednesdayOpen: z.number().nullable().optional(),
      wednesdayClose: z.number().nullable().optional(),
      thursdayOpen: z.number().nullable().optional(),
      thursdayClose: z.number().nullable().optional(),
      fridayOpen: z.number().nullable().optional(),
      fridayClose: z.number().nullable().optional(),
      saturdayOpen: z.number().nullable().optional(),
      saturdayClose: z.number().nullable().optional(),
      sundayOpen: z.number().nullable().optional(),
      sundayClose: z.number().nullable().optional(),
    })
    .optional(),
  timeSlotInterval: z.literal(30).or(z.literal(60)).optional(),
});

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