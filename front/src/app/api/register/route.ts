// front/src/app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/shared/lib/db";
import { normalizePhoneNumber } from "@/shared/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // --- CAMBIO: Aceptamos el email, que ahora es obligatorio ---
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return new NextResponse("Todos los campos son obligatorios", { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const lowercasedEmail = email.toLowerCase();

    // --- MEJORA: Verificar si el email O el teléfono ya existen ---
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: lowercasedEmail },
          { phone: normalizedPhone },
        ],
      },
    });

    if (existingUser) {
        const message = existingUser.email === lowercasedEmail
            ? "Ya existe una cuenta con este email."
            : "Ya existe una cuenta con este número de teléfono.";
      return new NextResponse(message, { status: 409 }); 
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email: lowercasedEmail,
        phone: normalizedPhone, 
        hashedPassword,
      },
    });


    const { hashedPassword: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("ERROR DE REGISTRO:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
