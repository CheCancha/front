import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { sendPasswordResetEmail } from "@/shared/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        message:
          "Si existe una cuenta con este email, se ha enviado un enlace para resetear la contraseña.",
      });
    }

    if (!user.email) {
      console.error(`El usuario con ID ${user.id} no tiene un email asociado.`);
      return NextResponse.json({
        message:
          "Si existe una cuenta con este email, se ha enviado un enlace para resetear la contraseña.",
      });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 3600 * 1000);

    await db.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expires },
      create: { userId: user.id, token, expires },
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({
      message:
        "Si existe una cuenta con este email, se ha enviado un enlace para resetear la contraseña.",
    });
  } catch (error) {
    console.error("[PASSWORD_RESET_REQUEST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
