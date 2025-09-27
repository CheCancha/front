import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { getMercadoPagoPreferenceClient } from "@/shared/lib/mercadopago";
import { format } from "date-fns";
import { BookingStatus } from "@prisma/client";
import SimpleCrypto from "simple-crypto-js";

export async function POST(req: Request) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseURL) {
      console.error("Error Crítico: NEXT_PUBLIC_BASE_URL no está definida.");
      return new NextResponse("Error de configuración del servidor.", {
        status: 500,
      });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const body = await req.json();
    const { complexId, courtId, date, time, price, depositAmount, guestName } =
      body;

    if (!userId && !guestName) {
      return new NextResponse("El nombre es requerido para los invitados", {
        status: 400,
      });
    }
    if (
      !complexId ||
      !courtId ||
      !date ||
      !time ||
      price === undefined ||
      depositAmount === undefined
    ) {
      return new NextResponse("Faltan datos para crear la reserva", {
        status: 400,
      });
    }

    const complex = await db.complex.findUnique({
      where: { id: complexId },
      select: {
        name: true,
        mp_access_token: true,
        mp_public_key: true,
        courts: {
          where: { id: courtId },
          include: { sport: true }
        },
      },
    });

    if (!complex || complex.courts.length === 0) {
      return new NextResponse(
        "El complejo o la cancha no fueron encontrados.",
        { status: 404 }
      );
    }
    const court = complex.courts[0];

    // --- Determinar qué credenciales usar ---
    let accessToken = "";
    let publicKey = "";

    if (complex.mp_access_token && complex.mp_public_key) {
      const secretKey = process.env.ENCRYPTION_KEY!;
      if (!secretKey) throw new Error("ENCRYPTION_KEY no está definida.");
      const crypto = new SimpleCrypto(secretKey);
      accessToken = crypto.decrypt(complex.mp_access_token) as string;
      publicKey = complex.mp_public_key; // <-- USAR LA PUBLIC KEY DEL CLUB
      console.log("Usando credenciales de producción del complejo.");
    } else {
      // Fallback a credenciales de prueba globales si el club no tiene las suyas
      accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
      publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!;
      console.log("Usando credenciales de prueba (fallback).");
      if (!accessToken || !publicKey) {
        return new NextResponse(
          "El complejo no tiene Mercado Pago configurado y no hay credenciales de prueba.",
          { status: 400 }
        );
      }
    }

    const bookingDate = new Date(date);
    const [hour, minute] = time.split(":").map(Number);

    const conflictingBookings = await db.booking.findMany({
      where: {
        courtId: courtId,
        date: bookingDate,
        status: { in: ["CONFIRMADO", "PENDIENTE"] },
      },
      include: {
        court: { select: { slotDurationMinutes: true } },
      },
    });

    const requestedStartMinutes = hour * 60 + minute;
    const requestedEndMinutes =
      requestedStartMinutes + court.slotDurationMinutes;

    const isConflict = conflictingBookings.some((booking) => {
      const existingStartMinutes =
        booking.startTime * 60 + (booking.startMinute || 0);
      const existingEndMinutes =
        existingStartMinutes + booking.court.slotDurationMinutes;
      return (
        requestedStartMinutes < existingEndMinutes &&
        requestedEndMinutes > existingStartMinutes
      );
    });

    if (isConflict) {
      return new NextResponse(
        "Lo sentimos, este horario ya no está disponible.",
        { status: 409 }
      );
    }

    const pendingBooking = await db.booking.create({
      data: {
        courtId,
        date: bookingDate,
        startTime: hour,
        startMinute: minute,
        totalPrice: price,
        depositAmount: depositAmount,
        depositPaid: 0, // Inicia en 0, se actualiza con el webhook
        remainingBalance: price,
        status: BookingStatus.PENDIENTE,
        ...(userId ? { userId: userId } : { guestName: guestName }),
      },
    });

    const preferenceClient = getMercadoPagoPreferenceClient(accessToken);

    try {
      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: courtId,
              title: `Seña para ${court.sport.name} en ${complex.name}`,
              description: `Turno para ${court.name} el ${format(
                bookingDate,
                "dd/MM/yyyy"
              )} a las ${time}hs`,
              quantity: 1,
              currency_id: "ARS",
              unit_price: depositAmount,
            },
          ],
          external_reference: pendingBooking.id,
          notification_url: `${baseURL}/api/webhooks/mercado-pago`,
          back_urls: {
            success: `${baseURL}/booking-status?status=success&booking_id=${pendingBooking.id}`,
            failure: `${baseURL}/booking-status?status=failure&booking_id=${pendingBooking.id}`,
            pending: `${baseURL}/booking-status?status=pending&booking_id=${pendingBooking.id}`,
          },
          auto_return: "approved",
        },
      });

      // --- DEVOLVER AMBOS DATOS AL FRONTEND ---
      return NextResponse.json({
        preferenceId: preference.id,
        publicKey: publicKey,
      });
    } catch (mpError: unknown) {
      await db.booking.delete({ where: { id: pendingBooking.id } });
      console.error("Error al crear preferencia en Mercado Pago:", mpError);
      return new NextResponse("Error al comunicarse con Mercado Pago.", {
        status: 400,
      });
    }
  } catch (error) {
    console.error("Error en create-preference:", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}
