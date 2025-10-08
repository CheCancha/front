import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { PriceRule } from "@prisma/client";
import { checkOnboarding } from "@/shared/lib/checkOnboarding";

type PriceRulePayload = Omit<PriceRule, "id" | "courtId">;

type CourtUpdatePayload = {
  id: string;
  name: string;
  sportId: string;
  slotDurationMinutes: number;
  priceRules: {
    create: PriceRulePayload[];
    update: { where: { id: string }; data: PriceRulePayload }[];
    delete: { id: string }[];
  };
};

type CourtCreatePayload = {
  name: string;
  sportId: string;
  slotDurationMinutes: number;
  priceRules: {
    create: PriceRulePayload[];
  };
};

type CourtsPayload = {
  update: CourtUpdatePayload[];
  create: CourtCreatePayload[];
  delete: { id: string }[];
};

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;
    const { complex, error } = await authorizeAndVerify(complexId);
    if (error) return error;
    
    if (!complex) {
        return new NextResponse("Complejo no encontrado.", { status: 404 });
    }

    const body = (await req.json()) as { courts: CourtsPayload };
    const { courts } = body;

    const isBasicPlan = complex.subscriptionPlan === 'BASE';
    const courtsToCreateCount = courts.create?.length || 0;

    if (isBasicPlan && courtsToCreateCount > 0) {
        const currentCourtCount = await db.court.count({
            where: { complexId },
        });
        const courtsToDeleteCount = courts.delete?.length || 0;
        const finalCourtCount = currentCourtCount + courtsToCreateCount - courtsToDeleteCount;

        if (finalCourtCount > 3) {
            return new NextResponse(
                JSON.stringify({ message: "Alcanzaste el límite de 3 canchas para el Plan Básico. Actualizá a Pro para agregar más." }),
                { status: 403 } 
            );
        }
    }

    await db.$transaction(
      async (prisma) => {
        if (courts.delete?.length > 0) {
          await prisma.court.deleteMany({
            where: { id: { in: courts.delete.map((c) => c.id) } },
          });
        }
        if (courts.update?.length > 0) {
          for (const court of courts.update) {
            await prisma.court.update({
              where: { id: court.id },
              data: {
                name: court.name,
                sportId: court.sportId,
                slotDurationMinutes: court.slotDurationMinutes,
                priceRules: {
                  create: court.priceRules.create,
                  updateMany: court.priceRules.update,
                  deleteMany: court.priceRules.delete,
                },
              },
            });
          }
        }
        if (courts.create?.length > 0) {
            for (const court of courts.create) {
                await prisma.court.create({
                    data: {
                        complexId: complexId,
                        name: court.name,
                        sportId: court.sportId,
                        slotDurationMinutes: court.slotDurationMinutes,
                        priceRules: { create: court.priceRules.create }
                    }
                })
            }
        }
      },
      { timeout: 30000 } 
    );

    // --- 2. LLAMAR A LA FUNCIÓN DE VERIFICACIÓN ---
    await checkOnboarding(complexId);

    return NextResponse.json({ message: "Canchas actualizadas exitosamente" });
  } catch (error) {
    console.error("[SETTINGS_COURTS_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

