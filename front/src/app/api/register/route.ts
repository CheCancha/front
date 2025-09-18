// front/src/app/api/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password } = body;

    if (!name || !phone || !password) {
      return new NextResponse("Faltan datos obligatorios", { status: 400 });
    }

    // 2. Normalizar el número de teléfono que llega desde el frontend
    const normalizedPhone = normalizePhoneNumber(phone);

    // 3. (MEJORA) Verificar si ya existe un usuario con ese teléfono normalizado
    const existingUser = await db.user.findUnique({
      where: {
        phone: normalizedPhone,
      },
    });

    if (existingUser) {
      return new NextResponse("Ya existe un usuario con este número de teléfono", { status: 409 }); 
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
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