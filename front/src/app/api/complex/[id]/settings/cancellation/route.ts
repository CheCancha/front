import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { z } from "zod";
import { authorizeAndVerify } from "@/shared/lib/authorize";

const cancellationSchema = z.object({
  cancellationPolicyHours: z.number().int().min(0),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;
    const { error } = await authorizeAndVerify(complexId);
    if (error) return error;

    const body = await req.json();
    const validation = cancellationSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: "Datos de entrada inválidos." }),
        { status: 400 }
      );
    }

    const { cancellationPolicyHours } = validation.data;

    await db.complex.update({
      where: { id: complexId },
      data: { cancellationPolicyHours },
    });

    return NextResponse.json({ message: "Política de cancelación actualizada con éxito." });

  } catch (error) {
    console.error("[CANCELLATION_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
