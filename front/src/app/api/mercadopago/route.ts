import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import SimpleCrypto from "simple-crypto-js";

const getMercadoPagoTokens = async (authCode: string) => {
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.MERCADOPAGO_CLIENT_ID!,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercado-pago/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error al obtener token de Mercado Pago:", error);
    throw new Error("No se pudo obtener el token de autorización de Mercado Pago.");
  }

  return response.json();
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?error=mp_auth_failed", req.url));
  }

  try {
    const mpData = await getMercadoPagoTokens(code);

    const {
      access_token,
      refresh_token,
      public_key,
      user_id: mp_user_id,
    } = mpData;

    const secretKey = process.env.ENCRYPTION_KEY!;
    const crypto = new SimpleCrypto(secretKey);
    const encryptedAccessToken = crypto.encrypt(access_token);
    const encryptedRefreshToken = crypto.encrypt(refresh_token);

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { managedComplex: true }
    });

    if (!user || !user.managedComplex) {
        throw new Error("El usuario no tiene un complejo asociado para actualizar.");
    }
    
    await db.complex.update({
        where: { id: user.managedComplex.id },
        data: {
            mp_access_token: encryptedAccessToken,
            mp_refresh_token: encryptedRefreshToken,
            mp_public_key: public_key,
            mp_user_id: mp_user_id.toString(),
            mp_connected_at: new Date(),
        }
    });


    // Redirigir al usuario de vuelta a su dashboard con un mensaje de éxito
    return NextResponse.redirect(new URL("/dashboard?status=mp_connected", req.url));
  
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/dashboard?error=mp_connection_error", req.url));
  }
}

