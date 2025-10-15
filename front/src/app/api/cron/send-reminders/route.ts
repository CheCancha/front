import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { addMinutes, startOfMinute } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const reminderTimeStart = startOfMinute(addMinutes(now, 58));
    const reminderTimeEnd = startOfMinute(addMinutes(now, 63));

    const upcomingBookings = await db.booking.findMany({
      where: {
        status: "CONFIRMADO",
        date: {
          gte: reminderTimeStart,
          lt: reminderTimeEnd,
        },
        reminderSent: false,
      },
      include: {
        user: { select: { id: true, oneSignalPlayerId: true } },
        court: {
          select: {
            name: true,
            complex: { select: { name: true } },
          },
        },
      },
    });

    if (upcomingBookings.length === 0) {
      return NextResponse.json({ message: "No hay reservas para notificar." });
    }

    const notifiedBookingIds: string[] = [];

    for (const booking of upcomingBookings) {
      if (!booking.user?.id || !booking.user.oneSignalPlayerId) {
        continue;
      }

      const complexName = booking.court.complex.name;
      const courtName = booking.court.name;
      const bookingTime = `${booking.startTime
        .toString()
        .padStart(2, "0")}:${booking.startMinute.toString().padStart(2, "0")}`;

      const notificationPayload = {
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        include_player_ids: [booking.user.oneSignalPlayerId],
        headings: { es: `¡Tu partido está por empezar!` },
        contents: {
          es: `Recordatorio: Tenés un turno a las ${bookingTime}hs en ${complexName}. ¡No te cuelgues!`,
        },
        web_url: `https://www.checancha.com/profile`
      };

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

      if (oneSignalResponse.ok) {
        notifiedBookingIds.push(booking.id);

        await db.notification.create({
          data: {
            userId: booking.user.id,
            title: notificationPayload.headings.es,
            message: notificationPayload.contents.es,
            url: notificationPayload.web_url,
          },
        });
      } else {
        console.error(
          `Error enviando notificación a OneSignal para la reserva ${booking.id}`
        );
      }
    }

    if (notifiedBookingIds.length > 0) {
      await db.booking.updateMany({
        where: { id: { in: notifiedBookingIds } },
        data: { reminderSent: true },
      });
    }

    return NextResponse.json({
      success: true,
      notified: notifiedBookingIds.length,
    });
  } catch (error) {
    console.error("Error en el Cron de notificaciones:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
