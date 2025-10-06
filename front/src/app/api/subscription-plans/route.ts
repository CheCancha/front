import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";

export async function GET() {
  try {
    const plans = await db.subscriptionPlanDetails.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("[GET_PLANS]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}