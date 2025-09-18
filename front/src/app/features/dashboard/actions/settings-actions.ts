"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { Sport } from "@prisma/client";
import { notFound } from "next/navigation";

// --- ACCIÓN 1: Obtener los datos para la página de Ajustes ---
export async function getSettingsPageData(complexId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("No autorizado");
  }

  const complexData = await db.complex.findFirst({
    where: {
      id: complexId,
      managerId: session.user.id, // Chequeo de propiedad
    },
    include: {
      schedule: true,
      courts: {
        orderBy: {
            name: 'asc'
        }
      },
    },
  });

  if (!complexData) {
    return notFound(); // Si no se encuentra, dispara un 404
  }
  return complexData;
}


// --- ACCIÓN 2: Guardar los cambios (El CRUD) ---

// Esquemas de validación con Zod para la data que llega del formulario
const courtSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "El nombre de la cancha es muy corto."),
  sport: z.nativeEnum(Sport),
  pricePerHour: z.coerce.number().min(0, "El precio debe ser positivo."),
  depositAmount: z.coerce.number().min(0, "La seña debe ser positiva."),
});

const settingsUpdateSchema = z.object({
  complexId: z.string(),
  general: z.object({
    openHour: z.coerce.number(),
    closeHour: z.coerce.number(),
    slotDurationMinutes: z.coerce.number(),
  }),
  courts: z.array(courtSchema),
});

export async function updateComplexSettings(data: unknown) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("No autorizado");

        const validatedData = settingsUpdateSchema.parse(data);
        const { complexId, general, courts: incomingCourts } = validatedData;
    
        await db.$transaction(async (prisma) => {
            await prisma.complex.update({
                where: { id: complexId, managerId: session.user.id },
                data: {
                    ...general,
                    onboardingCompleted: true,
                },
            });

            const existingCourts = await prisma.court.findMany({ where: { complexId } });
            const existingCourtIds = existingCourts.map(c => c.id);
            const incomingCourtIds = incomingCourts.map(c => c.id).filter(Boolean);

            const courtsToDelete = existingCourtIds.filter(id => !incomingCourtIds.includes(id));
            if (courtsToDelete.length > 0) {
                await prisma.court.deleteMany({ where: { id: { in: courtsToDelete } } });
            }

            for (const court of incomingCourts) {
                if (court.id) {
                    await prisma.court.update({
                        where: { id: court.id },
                        data: { name: court.name, sport: court.sport, pricePerHour: court.pricePerHour, depositAmount: court.depositAmount },
                    });
                } else {
                    await prisma.court.create({
                        data: { complexId, name: court.name, sport: court.sport, pricePerHour: court.pricePerHour, depositAmount: court.depositAmount },
                    });
                }
            }
        });

        revalidatePath(`/dashboard/${complexId}/settings`);
        revalidatePath(`/dashboard/${complexId}`);
        return { success: "Ajustes guardados con éxito." };

    } catch (error) {
        if (error instanceof z.ZodError) return { error: error.issues[0].message };
        console.error("Error al actualizar ajustes:", error);
        return { error: "No se pudieron guardar los cambios." };
    }
}