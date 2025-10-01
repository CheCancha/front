import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { id: requestId } = await context.params;

    const body = await request.json();
    const {
      ownerName,
      ownerEmail,
      ownerPhone,
      complexName,
      address,
      city,
      province,
      sports,
      selectedPlan,
    } = body;

    const updatedRequest = await db.inscriptionRequest.update({
      where: { id: requestId },
      data: {
        ownerName,
        ownerEmail,
        ownerPhone,
        complexName,
        address,
        city,
        province,
        sports,
        selectedPlan,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[ADMIN_REQUEST_PATCH]", error);
    return new NextResponse("Error Interno del Servidor", { status: 500 });
  }
}
