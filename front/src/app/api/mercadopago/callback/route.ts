import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";
import { routes } from "@/routes";

const getMercadoPagoTokens = async (authCode: string) => {
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MERCADOPAGO_CLIENT_ID!,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error al obtener token de MP:", error);
    throw new Error("No se pudo obtener el token de autorización de MP.");
  }
  return response.json();
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL(routes.auth.ingreso, process.env.NEXT_PUBLIC_BASE_URL!)
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const complexId = req.nextUrl.searchParams.get("state");

  if (!code || !complexId) {
    const errorUrl = new URL("/dashboard", process.env.NEXT_PUBLIC_BASE_URL!);
    errorUrl.searchParams.set("error", "mp_auth_failed");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const complex = await db.complex.findFirst({
      where: { id: complexId, managerId: session.user.id },
    });

    if (!complex) {
      throw new Error("El usuario no gestiona el complejo especificado.");
    }

    const mpData = await getMercadoPagoTokens(code);
    const { access_token, refresh_token, public_key, user_id: mp_user_id } = mpData;

    const secretKey = process.env.ENCRYPTION_KEY!;
    const crypto = new SimpleCrypto(secretKey);
    const encryptedAccessToken = crypto.encrypt(access_token);
    const encryptedRefreshToken = crypto.encrypt(refresh_token);

    await db.complex.update({
      where: { id: complexId },
      data: {
        mp_access_token: encryptedAccessToken,
        mp_refresh_token: encryptedRefreshToken,
        mp_public_key: public_key,
        mp_user_id: mp_user_id.toString(),
        mp_connected_at: new Date(),
      },
    });

    const successUrl = new URL(
      routes.app.settings(complexId),
      process.env.NEXT_PUBLIC_BASE_URL!
    );
    successUrl.searchParams.set("status", "mp_connected");
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error("Error en el callback de Mercado Pago:", error);
    const errorUrl = new URL(
      routes.app.settings(complexId),
      process.env.NEXT_PUBLIC_BASE_URL!
    );
    errorUrl.searchParams.set("error", "mp_connection_error");
    return NextResponse.redirect(errorUrl);
  }
}

