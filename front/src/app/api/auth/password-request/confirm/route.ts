import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // 1. Buscar el token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    // 2. Validar que el token exista y no haya expirado
    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ error: "El token es inválido o ha expirado." }, { status: 400 });
    }

    // 3. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Actualizar la contraseña del usuario
    await db.user.update({
      where: { id: resetToken.userId },
      data: { hashedPassword },
    });

    // 5. Eliminar el token para que no pueda ser reutilizado
    await db.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("[PASSWORD_RESET_CONFIRM]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}