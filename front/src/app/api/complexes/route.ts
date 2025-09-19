// front/src/app/api/admin/complexes/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
