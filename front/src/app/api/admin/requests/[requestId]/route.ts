import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";

interface Context {
  params: Promise<{
    requestId: string;
  }>;
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { requestId } = await context.params;

    if (!requestId) {
      return new NextResponse("ID de solicitud no encontrado", { status: 400 });
    }

    const body = await request.json();
    const updatedRequest = await db.inscriptionRequest.update({
      where: { id: requestId },
      data: body,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[ADMIN_REQUEST_PATCH]", error);
    return new NextResponse("Error Interno del Servidor", { status: 500 });
  }
}
