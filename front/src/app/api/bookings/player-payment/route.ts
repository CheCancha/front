import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { PaymentMethod, TransactionType, TransactionSource } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // 1. AUTENTICACIÓN Y AUTORIZACIÓN
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. OBTENER DATOS DE ENTRADA
    const body = await req.json();
    const {
      bookingPlayerId,
      amount,
      paymentMethod,
    }: {
      bookingPlayerId: string;
      amount: number;
      paymentMethod: PaymentMethod;
    } = body;

    // 3. VALIDACIÓN
    if (!bookingPlayerId || !amount || !paymentMethod) {
      return new NextResponse("Faltan datos (jugador, monto o método)", {
        status: 400,
      });
    }
    if (amount <= 0) {
      return new NextResponse("El monto debe ser positivo", { status: 400 });
    }

    // 4. TRANSACCIÓN PRINCIPAL
    const updatedPlayer = await db.$transaction(
      async (tx) => {
        // a. Buscar jugador y su reserva
        const player = await tx.bookingPlayer.findUniqueOrThrow({
          where: { id: bookingPlayerId },
          include: {
            user: { select: { name: true } },
            booking: {
              select: {
                id: true,
                court: {
                  select: { name: true, complexId: true },
                },
                totalPrice: true,
                depositPaid: true,
                remainingBalance: true,
                status: true,
              },
            },
          },
        });

        const booking = player.booking;

        if (booking.status === "CANCELADO") {
          throw new Error("No se puede pagar una reserva cancelada");
        }

        // b. Validar que el pago no supere el saldo
        if (amount > booking.remainingBalance) {
          throw new Error("El monto excede el saldo pendiente.");
        }

        // 🧮 Cálculo del nuevo estado financiero
        const newDepositPaid = booking.depositPaid + amount;
        const newRemainingBalance = booking.remainingBalance - amount;
        const isFullyPaid = newRemainingBalance <= 0;

        // c. Actualizar Booking
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            depositPaid: newDepositPaid,
            remainingBalance: newRemainingBalance,
            status: isFullyPaid ? "COMPLETADO" : booking.status,
          },
        });

        // d. Actualizar jugador
        const updatedPlayer = await tx.bookingPlayer.update({
          where: { id: bookingPlayerId },
          data: {
            amountPaid: { increment: amount },
            paymentMethod,
            paymentStatus: isFullyPaid ? "PAGADO" : "PENDIENTE",
          },
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        });

        // e. Crear transacción individual por este pago
        const playerName = player.user?.name || player.guestName || "Jugador";
        const courtName = booking.court.name;
        const description = `Pago ${playerName} (Res. ${courtName})`;

        await tx.transaction.create({
          data: {
            complexId: booking.court.complexId,
            amount,
            type: TransactionType.INGRESO,
            source: TransactionSource.RESERVA,
            paymentMethod,
            description,
            bookingPlayerId,
          },
        });

        return updatedPlayer;
      },
      { timeout: 10000 }
    );

    return NextResponse.json(updatedPlayer, { status: 200 });
  } catch (error) {
    console.error("[PLAYER_PAYMENT_POST]", error);

    if (error instanceof Error) {
      if (error.message.includes("excede")) {
        return new NextResponse(error.message, { status: 409 });
      }
      if (error.message.includes("cancelada")) {
        return new NextResponse(error.message, { status: 400 });
      }
    }

    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}