import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { addMinutes, startOfMinute } from "date-fns";
import { format } from "date-fns-tz";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export async function GET(request: Request) {
  console.log("🚀 CRON: Iniciando ejecución de send-reminders..."); // 🪵 LOG 1: Inicio

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("❌ CRON ERROR: Unauthorized - Bearer token inválido o ausente."); // 🪵 LOG 2: Error Auth
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    // ⚠️ SUGERENCIA: Ampliar la ventana ligeramente para más robustez (ej: 55 a 65 mins)
    const reminderTimeStart = startOfMinute(addMinutes(now, 55)); 
    const reminderTimeEnd = startOfMinute(addMinutes(now, 65)); 

    // 🪵 LOG 3: Mostrar la ventana de tiempo en UTC y ARG
    console.log(`🕒 CRON: Buscando reservas entre ${reminderTimeStart.toISOString()} y ${reminderTimeEnd.toISOString()} (UTC)`);
    console.log(`🕒 CRON: Equivalente en ARG: ${format(reminderTimeStart, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: ARGENTINA_TIME_ZONE })} a ${format(reminderTimeEnd, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: ARGENTINA_TIME_ZONE })}`);


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
    console.log(`🔍 CRON: Se encontraron ${upcomingBookings.length} reservas para notificar.`);

    if (upcomingBookings.length === 0) {
      return NextResponse.json({ message: "No hay reservas para notificar." });
    }

    const notifiedBookingIds: string[] = [];
    const failedBookingIds: string[] = []; // 🪵 Para rastrear fallos

    for (const booking of upcomingBookings) {
      // 🪵 LOG 5: Procesando cada reserva
      console.log(`📨 CRON: Procesando reserva ID: ${booking.id} - Fecha UTC: ${booking.date.toISOString()}`);

      if (!booking.user?.id || !booking.user.oneSignalPlayerId) {
        console.warn(`⚠️ CRON WARN: Reserva ${booking.id} omitida - Falta user.id o oneSignalPlayerId.`); // 🪵 LOG 6: Omisión
        failedBookingIds.push(booking.id + " (missing user/player_id)");
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

      console.log(`📣 CRON: Respuesta OneSignal para reserva ${booking.id} - Status: ${oneSignalResponse.status}, OK: ${oneSignalResponse.ok}`);

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
      console.log(`✅ CRON: Notificación enviada y registrada para reserva ${booking.id}.`); // 🪵 LOG 8: Éxito
        } else {
        const errorBody = await oneSignalResponse.text(); // Leer el cuerpo del error
          console.error(
            `❌ CRON ERROR: Fallo al enviar a OneSignal para reserva ${booking.id}. Status: ${oneSignalResponse.status}, Body: ${errorBody}`
          );
          failedBookingIds.push(booking.id + ` (OneSignal status ${oneSignalResponse.status})`);
        }
      } catch (fetchError) {
          // 🪵 LOG 10: Error de red al llamar a OneSignal
          console.error(`❌ CRON FETCH ERROR: Error de red al llamar a OneSignal para reserva ${booking.id}:`, fetchError);
          failedBookingIds.push(booking.id + " (fetch error)");
      }
    }

    if (notifiedBookingIds.length > 0) {
      try { // 👈 Añadir try/catch alrededor del updateMany
        await db.booking.updateMany({
          where: { id: { in: notifiedBookingIds } },
          data: { reminderSent: true },
        });
        console.log(`💾 CRON: Marcadas ${notifiedBookingIds.length} reservas como notificadas.`); // 🪵 LOG 11: Update DB
      } catch (dbError) {
          console.error(`❌ CRON DB ERROR: Error al actualizar 'reminderSent':`, dbError); // 🪵 LOG 12: Error DB Update
      }
    }

    console.log("🏁 CRON: Ejecución finalizada."); // 🪵 LOG 13: Fin

    return NextResponse.json({
      success: true,
      notified: notifiedBookingIds.length,
      attempted: upcomingBookings.length,
      failures: failedBookingIds.length,
      failedBookingDetails: failedBookingIds, // 🪵 Devolver detalles de fallos
    });

  } catch (error) {
    console.error("💥 CRON CATCH GENERAL:", error); // 🪵 LOG 14: Error General
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}