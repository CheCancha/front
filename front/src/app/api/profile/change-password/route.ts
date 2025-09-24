import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });

    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    );

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: session.user.id },
      data: { hashedPassword: hashedNewPassword },
    });

    return NextResponse.json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}