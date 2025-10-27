import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { differenceInHours } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { es } from "date-fns/locale";
import {
  sendBookingCancelledByPlayerEmail,
  sendBookingCancelledByManagerEmail,
} from "@/shared/lib/email";
import { BookingStatus } from "@prisma/client";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export async function POST(
  req: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params; 
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return new NextResponse("No autenticado", { status: 401 });

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        court: {
          include: {
            sport: true, 
            complex: {
              include: { 
                 manager: true 
              },
            },
          },
        },
      },
    });

    if (!booking)
      return new NextResponse("Reserva no encontrada", { status: 404 });

    // Validaciones
    const isPlayerOwner = booking.userId === session.user.id;
    const isComplexManager =
      booking.court?.complex?.managerId === session.user.id;

    if (!isPlayerOwner && !isComplexManager && session.user.role !== "ADMIN")
      return new NextResponse("No autorizado", { status: 403 });

    if (booking.status !== BookingStatus.CONFIRMADO && booking.status !== BookingStatus.PENDIENTE)
      return new NextResponse("Solo se pueden cancelar reservas confirmadas o pendientes.", {
        status: 400,
      });

    // --- Lógica de Cancelación ---
    const now = new Date();
    const bookingDateTime = booking.date; 
    const hoursDifference = differenceInHours(bookingDateTime, now);
    const cancellationPolicyHours =
      booking.court?.complex?.cancellationPolicyHours ?? 0;

    const refundPending =
      booking.status === BookingStatus.CONFIRMADO && 
      booking.depositPaid > 0 && 
      cancellationPolicyHours > 0 &&
      hoursDifference >= cancellationPolicyHours;

    await db.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELADO, refundPending },
    });

    let targetUserId: string | null = null;
    let targetPlayerId: string | null = null;
    let notificationTitle = "";
    let notificationMessage = "";

    const formattedBookingDate = formatInTimeZone(booking.date, ARGENTINA_TIME_ZONE, "dd/MM/yyyy", { locale: es });
    const formattedBookingTime = formatInTimeZone(booking.date, ARGENTINA_TIME_ZONE, "HH:mm'hs'", { locale: es });

    const complexName = booking.court?.complex?.name ?? "El complejo";
    const courtName = booking.court?.name ?? "la cancha";

    if (isPlayerOwner) {
      // Jugador cancela -> Notificar al MANAGER
      targetUserId = booking.court?.complex?.managerId ?? null;
      targetPlayerId = booking.court?.complex?.manager?.oneSignalPlayerId ?? null;
      notificationTitle = "Reserva Cancelada por Jugador";
      // ✅ Usar las variables formateadas correctamente
      notificationMessage = `${booking.user?.name ?? 'Un jugador'} canceló el turno de ${courtName} del ${formattedBookingDate} a las ${formattedBookingTime}. El horario está libre.`;
      
      try { await sendBookingCancelledByPlayerEmail(booking); } catch (e) { console.error("Error email a manager:", e); }

    } else { 
      // Manager/Admin cancela -> Notificar al JUGADOR
      targetUserId = booking.userId ?? null;
      targetPlayerId = booking.user?.oneSignalPlayerId ?? null;
      notificationTitle = "Tu Reserva fue Cancelada";
      notificationMessage = `${complexName} canceló tu reserva de ${courtName} del ${formattedBookingDate} a las ${formattedBookingTime}. Contactate si tenés dudas.`;

       try { await sendBookingCancelledByManagerEmail(booking); } catch (e) { console.error("Error email a jugador:", e); }
    }

    // Si tenemos a quién notificar (Player ID) y un usuario asociado
    if (targetPlayerId && targetUserId) {
      const notificationPayload = {
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        include_player_ids: [targetPlayerId],
        headings: { es: notificationTitle, en: notificationTitle },
        contents: { es: notificationMessage, en: notificationMessage },
        web_url: isPlayerOwner 
          ? `https://www.checancha.com/dashboard/${booking.court.complex.id}/booking`
          : `https://www.checancha.com/profile`,
        
      };

      try {
        console.log(`[CANCEL NOTIF] Intentando enviar push a ${targetPlayerId}...`);
        const oneSignalResponse = await fetch(
          "https://onesignal.com/api/v1/notifications",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY!}`,
            },
            body: JSON.stringify(notificationPayload),
          }
        );
        const responseBody = await oneSignalResponse.text();

        if (oneSignalResponse.ok) {
          console.log(`✅ [CANCEL NOTIF] Push enviado con éxito a ${targetPlayerId}.`);
          await db.notification.create({
            data: {
              userId: targetUserId,
              title: notificationTitle,
              message: notificationMessage,
              url: notificationPayload.web_url,
            },
          });
          console.log(`✅ [CANCEL NOTIF] Notificación interna guardada para ${targetUserId}.`);
        } else {
          console.error(
            `❌ [CANCEL NOTIF] Error OneSignal (${oneSignalResponse.status}): ${responseBody}`
          );
        }
      } catch (pushError) {
        console.error("❌ [CANCEL NOTIF] Error en fetch a OneSignal:", pushError);
      }
    } else {
        console.log(`[CANCEL NOTIF] No se envió push: targetPlayerId (${targetPlayerId}) o targetUserId (${targetUserId}) no encontrado.`);
    }

    return NextResponse.json({ success: true, message: "Reserva cancelada." });
  } catch (error) {
    console.error("[BOOKING_CANCEL_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}