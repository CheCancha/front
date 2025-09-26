import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { PriceRule } from "@prisma/client";

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
    const { id } = await context.params;
    const { error } = await authorizeAndVerify(id);
    if (error) return error;

    const body = (await req.json()) as { courts: CourtsPayload };
    const { courts } = body;

    await db.$transaction(
      async (prisma) => {
        // --- Eliminar canchas ---
        if (courts.delete?.length > 0) {
          await prisma.court.deleteMany({
            where: { id: { in: courts.delete.map((c) => c.id) } },
          });
        }
        
        // ---  Procesar actualizaciones en lotes ---
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
        
        // ---  Procesar creaciones en lotes ---
        if (courts.create?.length > 0) {
            for (const court of courts.create) {
                await prisma.court.create({
                    data: {
                        complexId: id,
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

    return NextResponse.json({ message: "Canchas actualizadas exitosamente" });
  } catch (error) {
    console.error("[SETTINGS_COURTS_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
