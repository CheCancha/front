import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "MANAGER" || !session?.user?.complexId) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await request.json();
    const { complexId } = body;

    if (session.user.complexId !== complexId) {
      return new NextResponse("Acción no permitida", { status: 403 });
    }

    const complex = await db.complex.findUnique({
      where: { id: complexId },
      select: { mp_access_token: true },
    });

    if (!complex?.mp_access_token) {
      return new NextResponse("La cuenta ya no está conectada.", {
        status: 400,
      });
    }

    await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID,
        client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
        test_token: false,
        access_token: complex.mp_access_token,
      }),
    });

    await db.complex.update({
      where: { id: complexId },
      data: {
        mp_access_token: null,
        mp_refresh_token: null,
        mp_public_key: null,
        mp_user_id: null,
        mp_connected_at: null,
      },
    });

    revalidatePath(`/dashboard/${complexId}/settings`);

    return NextResponse.json({ message: "Desconexión exitosa" });
  } catch (error) {
    console.error("[MP_DISCONNECT_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
