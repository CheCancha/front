import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // 1. Autenticación y autorización
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'MANAGER') {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Verificación de propiedad (seguridad)
    const complexToUpdate = await db.complex.findFirst({
        where: {
            id: id,
            managerId: session.user.id
        }
    });

    if (!complexToUpdate) {
        return new NextResponse("Complejo no encontrado o no tienes permiso para editarlo.", { status: 403 });
    }

    // 3. Marcar el onboarding como completado
    await db.complex.update({
      where: { id: id },
      data: {
        onboardingCompleted: true
      }
    });

    return NextResponse.json({ 
      message: "Onboarding completado exitosamente",
      redirectTo: `/dashboard/${id}` 
    });

  } catch (error) {
    console.error("[COMPLETE_ONBOARDING_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}