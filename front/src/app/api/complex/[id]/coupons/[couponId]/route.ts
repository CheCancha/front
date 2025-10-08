import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { z } from "zod";

const updateSchema = z.object({
  isActive: z.boolean(),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string; couponId: string }> }
) {
  try {
    const { id: complexId, couponId } = await context.params;
    const { complex, error } = await authorizeAndVerify(complexId);
    if (error) return error;

    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.format()), {
        status: 400,
      });
    }

    const { isActive } = validation.data;

    const updatedCoupon = await db.coupon.update({
      where: {
        id: couponId,
        complexId: complex.id,
      },
      data: {
        isActive,
      },
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error("[COUPON_UPDATE_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
