import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { addMinutes, startOfMinute } from "date-fns";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export async function GET(request: Request) {
  console.log("🚀 CRON: Iniciando ejecución de send-reminders...");

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const reminderTimeStart = startOfMinute(addMinutes(now, 20));
    const reminderTimeEnd = startOfMinute(addMinutes(now, 30));

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
    const failedBookingIds: string[] = []; 

    for (const booking of upcomingBookings) {

      if (!booking.user?.id || !booking.user.oneSignalPlayerId) {
        failedBookingIds.push(booking.id + " (missing user/player_id)");
        continue;
      }
      const complexName = booking.court.complex.name;
      // const courtName = booking.court.name;
      const bookingTime = `${booking.startTime
        .toString()
        .padStart(2, "0")}:${booking.startMinute.toString().padStart(2, "0")}`;

      const notificationPayload = {
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        include_player_ids: [booking.user.oneSignalPlayerId],
        headings: {
          es: `¡Tu partido está por empezar!`,
          en: `¡Tu partido está por empezar!`,
        },
        contents: {
          es: `Recordatorio: Tenés un turno a las ${bookingTime}hs en ${complexName}. ¡No te cuelgues!`,
          en: `Recordatorio: Tenés un turno a las ${bookingTime}hs en ${complexName}. ¡No te cuelgues!`,
        },
        web_url: `https://www.checancha.com/profile`,
      };

      try {
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
          failedBookingIds.push(
            booking.id + ` (OneSignal status ${oneSignalResponse.status})`
          );
        }
      } catch (fetchError) {
        failedBookingIds.push(booking.id + " (fetch error)");
      }
    }

    if (notifiedBookingIds.length > 0) {
      try {
        await db.booking.updateMany({
          where: { id: { in: notifiedBookingIds } },
          data: { reminderSent: true },
        });
      } catch (dbError) {
        console.error(
          `❌ CRON DB ERROR: Error al actualizar 'reminderSent':`,
          dbError
        ); 
      }
    }


    return NextResponse.json({
      success: true,
      notified: notifiedBookingIds.length,
      attempted: upcomingBookings.length,
      failures: failedBookingIds.length,
      failedBookingDetails: failedBookingIds, 
    });
  } catch (error) {
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
