import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { z } from "zod";

const validateSchema = z.object({
  couponCode: z.string(),
  originalPrice: z.number(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;

    // Verificamos que el complejo exista, pero no necesitamos la sesión para esta acción pública
    const complex = await db.complex.findUnique({ where: { id: complexId } });
    if (!complex) {
      return NextResponse.json(
        { error: "Complejo no encontrado." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = validateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    const { couponCode, originalPrice } = validation.data;

    const coupon = await db.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        complexId: complexId,
      },
    });

    // --- Validaciones ---
    if (!coupon) {
      return NextResponse.json(
        { error: "El código del cupón no existe." },
        { status: 404 }
      );
    }
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Este cupón ya no está activo." },
        { status: 400 }
      );
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return NextResponse.json(
        { error: "Este cupón ha expirado." },
        { status: 400 }
      );
    }
    if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) {
      return NextResponse.json(
        { error: "Este cupón ha alcanzado su límite de usos." },
        { status: 400 }
      );
    }

    // --- Cálculo del Descuento ---
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (originalPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    const newTotalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      code: coupon.code,
      discountAmount: discountAmount,
      newTotalPrice: newTotalPrice,
    });
  } catch (error) {
    console.error("[COUPON_VALIDATE_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
