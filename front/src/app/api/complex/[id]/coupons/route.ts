import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres").max(20),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().int().min(1, "El valor debe ser mayor a 0"),
  validUntil: z.string().optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET: Obtener todos los cupones de un complejo
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;
    const { error } = await authorizeAndVerify(complexId);
    if (error) return error;

    const coupons = await db.coupon.findMany({
      where: { complexId: complexId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("[COUPONS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// POST: Crear un nuevo cupón
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;
    const { complex, error } = await authorizeAndVerify(complexId);
    if (error) return error;

    // Solo usuarios Pro o en prueba pueden crear cupones
    const isAllowed =
      complex.subscriptionPlan === "FULL" ||
      complex.subscriptionStatus === "EN_PRUEBA";
    if (!isAllowed) {
      return new NextResponse("Esta es una funcionalidad del Plan Pro.", {
        status: 403,
      });
    }

    const body = await req.json();
    const validation = couponSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      validUntil,
      maxUses,
      isActive,
    } = validation.data;

    const existingCoupon = await db.coupon.findFirst({
      where: { code: code.toUpperCase(), complexId: complexId },
    });
    if (existingCoupon) {
      return NextResponse.json(
        { error: "Ya existe un cupón con este código." },
        { status: 409 }
      );
    }

    const newCoupon = await db.coupon.create({
      data: {
        complexId: complexId,
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue:
          discountType === "PERCENTAGE"
            ? Math.min(discountValue, 100)
            : discountValue,
        validUntil: validUntil ? new Date(validUntil) : null,
        maxUses,
        isActive,
      },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error("[COUPONS_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
