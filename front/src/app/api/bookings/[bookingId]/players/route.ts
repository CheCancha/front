// front/src/app/api/bookings/[bookingId]/players/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

/**
 * OBTIENE LA LISTA DE JUGADORES DE UNA RESERVA
 * GET /api/bookings/[bookingId]/players
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // 1. AUTENTICACIÓN Y AUTORIZACIÓN
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. OBTENER DATOS DE ENTRADA
    const { bookingId } = await params;

    if (!bookingId) {
      return new NextResponse("Falta el ID de la reserva (bookingId)", {
        status: 400,
      });
    }

    // 3. OBTENER LOS DATOS
    const players = await db.bookingPlayer.findMany({
      where: {
        bookingId: bookingId,
      },
      include: {
        // Incluimos los datos del 'User' si está vinculado
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // El primero suele ser quien reservó
      },
    });

    // 4. RESPUESTA EXITOSA
    return NextResponse.json(players);
  } catch (error) {
    console.error("[BOOKING_GET_PLAYERS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // 1. AUTENTICACIÓN Y AUTORIZACIÓN
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. OBTENER DATOS DE ENTRADA
    const { bookingId } = await params;
    const body = await req.json();
    const { userId, guestName } = body;

    // 3. VALIDACIÓN DE ENTRADA
    if (!bookingId) {
      return new NextResponse("Falta el ID de la reserva (bookingId)", {
        status: 400,
      });
    }

    if (!userId && !guestName) {
      return new NextResponse(
        "Se requiere 'userId' (para usuarios) o 'guestName' (para invitados)",
        { status: 400 }
      );
    }

    // 4. LÓGICA DE NEGOCIO
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return new NextResponse("La reserva no fue encontrada", { status: 404 });
    }

    if (userId) {
      const existingPlayer = await db.bookingPlayer.findFirst({
        where: { bookingId: bookingId, userId: userId },
      });
      if (existingPlayer) {
        return new NextResponse("Este usuario ya está en la reserva", {
          status: 409,
        });
      }
    }

    // 5. CREACIÓN DEL REGISTRO
    const newBookingPlayer = await db.bookingPlayer.create({
      data: {
        bookingId: bookingId,
        userId: userId || null,
        guestName: userId ? null : guestName,
        paymentStatus: "PENDIENTE",
        amountPaid: 0,
        paymentMethod: null,
      },
      include: {
        // Devolvemos el usuario para mostrarlo en el front
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // 6. RESPUESTA EXITOSA
    return NextResponse.json(newBookingPlayer, { status: 201 });
  } catch (error) {
    console.error("[BOOKING_ADD_PLAYER_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    // 1. AUTENTICACIÓN Y AUTORIZACIÓN
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. OBTENER DATOS DE ENTRADA
    const { searchParams } = new URL(req.url);
    const bookingPlayerId = searchParams.get("playerId");

    if (!bookingPlayerId) {
      return new NextResponse("Falta el ID del jugador ('playerId')", {
        status: 400,
      });
    }

    // 3. LÓGICA DE NEGOCIO (Busca y elimina)

    // Chequeo de seguridad: antes de borrar, verificar si hay un pago registrado
    const playerToDelete = await db.bookingPlayer.findUnique({
      where: { id: bookingPlayerId },
    });

    if (!playerToDelete) {
      return new NextResponse("Jugador no encontrado en la reserva", {
        status: 404,
      });
    }

    // Si el jugador ya pagó (monto mayor a cero), no se puede borrar directamente.
    // Esto es una regla de negocio importante para contabilidad.
    if (playerToDelete.amountPaid > 0) {
      return new NextResponse(
        "No se puede eliminar un jugador que ya tiene un pago registrado.",
        { status: 403 }
      );
    }
    
    // Si no hay pago, se elimina el jugador
    await db.bookingPlayer.delete({
      where: { id: bookingPlayerId },
    });

    // 4. RESPUESTA EXITOSA
    return new NextResponse("Jugador eliminado", { status: 200 });
  } catch (error) {
    console.error("[BOOKING_DELETE_PLAYER]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}