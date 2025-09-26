import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

type BasicInfoPayload = {
  name: string;
  address: string;
  city: string;
  province: string;
};

async function authorizeAndVerify(complexId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return { error: new NextResponse("No autorizado", { status: 401 }) };
  }

  const complex = await db.complex.findFirst({
    where: { id: complexId, managerId: session.user.id },
  });

  if (!complex) {
    return { error: new NextResponse("Complejo no encontrado", { status: 404 }) };
  }

  return { session, complex };
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { error } = await authorizeAndVerify(id);
    if (error) return error;

    const body = (await req.json()) as { basicInfo: BasicInfoPayload };

    await db.complex.update({
      where: { id },
      data: {
        ...body.basicInfo,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ message: "Información general actualizada" });
  } catch (error) {
    console.error("[SETTINGS_GENERAL_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
