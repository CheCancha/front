import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";

export async function GET() {
  const complexes = await db.complex.findMany({
    where: { onboardingCompleted: true },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      manager: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  return NextResponse.json(complexes);
}
