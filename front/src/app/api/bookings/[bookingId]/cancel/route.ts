import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { differenceInHours } from "date-fns";

export async function POST(
  req: Request,
  context: unknown
) {
  const { bookingId } = (context as { params: { bookingId: string } }).params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autenticado", { status: 401 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          include: {
            complex: true,
          },
        },
      },
    });

    if (!booking) {
      return new NextResponse("Reserva no encontrada", { status: 404 });
    }

    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("No autorizado", { status: 403 });
    }

    if (booking.status !== "CONFIRMADO") {
      return new NextResponse("Solo se pueden cancelar reservas confirmadas.", {
        status: 400,
      });
    }

    const now = new Date();
    const bookingDateTime = booking.date;
    const hoursDifference = differenceInHours(bookingDateTime, now);

    const cancellationPolicyHours =
      booking.court.complex.cancellationPolicyHours;

    let refundPending = false;
    if (hoursDifference >= cancellationPolicyHours) {
      refundPending = true;
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELADO",
        refundPending: refundPending,
      },
    });

    // Aquí podría agregar notificaciones por email al manager y al usuario.

    return NextResponse.json({ success: true, message: "Reserva cancelada." });
  } catch (error) {
    console.error("[BOOKING_CANCEL_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
