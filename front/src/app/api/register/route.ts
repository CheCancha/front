import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {db} from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password } = body;

    if (!name || !phone || !password) {
      return new NextResponse("Faltan datos", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        phone,
        hashedPassword,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("ERROR DE REGISTRO:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}