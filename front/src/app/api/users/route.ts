import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { Role, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");

    const takeValue = 10;

    const whereCondition: Prisma.UserWhereInput = {};

    if (searchQuery && searchQuery.length > 1) {
      whereCondition.OR = [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ];
    }

    const users = await db.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
      take: takeValue,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email } = body;

    if (!name) {
      return NextResponse.json(
        { message: "El nombre es obligatorio" }, 
        { status: 400 }
      );
    }

    // Chequeo de Email
    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { message: "Ya existe un usuario con ese email" }, 
          { status: 409 } 
        );
      }
    }

    if (phone) {
      const existingUserByPhone = await db.user.findUnique({
        where: { phone },
      });
      if (existingUserByPhone) {
        return NextResponse.json(
          { message: "Ya existe un usuario con ese teléfono" }, 
          { status: 409 } 
        );
      }
    }

    const newUser = await db.user.create({
      data: {
        name,
        phone: phone || null,
        email: email || `${new Date().getTime()}@invitado.checancha`,
        role: Role.USER,
        hashedPassword: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("[USERS_POST]", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('phone')) {
          return NextResponse.json(
            { message: "Ya existe un usuario con ese teléfono" }, 
            { status: 409 }
          );
        }
        if (target.includes('email')) {
           return NextResponse.json(
             { message: "Ya existe un usuario con ese email" }, 
             { status: 409 }
           );
        }
      }
    }
    
    return NextResponse.json(
      { message: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}