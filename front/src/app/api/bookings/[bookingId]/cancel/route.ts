import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { differenceInHours } from "date-fns";
import { sendBookingCancelledByPlayerEmail, sendBookingCancelledByManagerEmail } from "@/shared/lib/email";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autenticado", { status: 401 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true, 
        court: {
          include: {
            complex: {
              include: {
                manager: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return new NextResponse("Reserva no encontrada", { status: 404 });
    }

    // --- LÓGICA DE AUTORIZACIÓN  ---
    const isPlayerOwner = booking.userId === session.user.id;
    const isComplexManager = booking.court.complex.managerId === session.user.id;

    if (!isPlayerOwner && !isComplexManager && session.user.role !== "ADMIN") {
      return new NextResponse("No autorizado para cancelar esta reserva.", { status: 403 });
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
    if (cancellationPolicyHours > 0 && hoursDifference >= cancellationPolicyHours) {
      refundPending = true;
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELADO",
        refundPending: refundPending,
      },
    });

    // --- LÓGICA DE NOTIFICACIONES ---
    if (isPlayerOwner) {
      console.log(`Notificando al manager (${booking.court.complex.manager.email}) y al jugador (${booking.user?.email}) sobre la cancelación por parte del jugador.`);
       await sendBookingCancelledByPlayerEmail(booking);
    } else {
      console.log(`Notificando al jugador (${booking.user?.email}) sobre la cancelación por parte del manager.`);
       await sendBookingCancelledByManagerEmail(booking);
    }

    return NextResponse.json({ success: true, message: "Reserva cancelada." });
  } catch (error) {
    console.error("[BOOKING_CANCEL_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}