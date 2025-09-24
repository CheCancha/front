import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const requests = await db.inscriptionRequest.findMany({
      where: {
        status: "PENDIENTE",
      },
      orderBy: {
        createdAt: "asc", 
      },
    });

    return NextResponse.json(requests);
    
  } catch (error) {
    console.error("[ADMIN_REQUESTS_GET]", error);
    return new NextResponse("Error Interno del Servidor", { status: 500 });
  }
}

