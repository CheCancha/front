import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { getMercadoPagoPreferenceClient } from "@/shared/lib/mercadopago";
import { format } from "date-fns";
import { BookingStatus } from "@prisma/client";
import SimpleCrypto from "simple-crypto-js";

interface MercadoPagoError extends Error {
  cause?: { message?: string } | { message?: string }[];
}

export async function POST(req: Request) {
  try {
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
        courts: { where: { id: courtId } },
      },
    });

    if (!complex || complex.courts.length === 0) {
      return new NextResponse(
        "El complejo o la cancha no fueron encontrados.",
        { status: 404 }
      );
    }
    const court = complex.courts[0];

    let accessToken = "";
    if (complex.mp_access_token) {
      const secretKey = process.env.ENCRYPTION_KEY!;
      if (!secretKey)
        throw new Error(
          "ENCRYPTION_KEY no está definida en las variables de entorno."
        );
      const crypto = new SimpleCrypto(secretKey);
      accessToken = crypto.decrypt(complex.mp_access_token) as string;
      console.log("Usando Access Token del complejo (producción).");
    } else {
      accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
      console.log("Usando Access Token de prueba (fallback).");
      if (!accessToken) {
        return new NextResponse(
          "El complejo no tiene Mercado Pago configurado y no hay token de prueba.",
          { status: 400 }
        );
      }
    }

    const bookingDate = new Date(date);
    const [hour, minute] = time.split(":").map(Number);

    const requestedStartMinutes = hour * 60 + minute;
    const requestedEndMinutes =
      requestedStartMinutes + court.slotDurationMinutes;

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
        "Lo sentimos, este horario ya no está disponible o se superpone con otra reserva.",
        { status: 409 }
      ); // 409 Conflict
    }

    const pendingBooking = await db.booking.create({
      data: {
        courtId,
        date: bookingDate,
        startTime: hour,
        startMinute: minute,
        totalPrice: price,
        depositPaid: depositAmount,
        remainingBalance: price - depositAmount,
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
              title: `Seña para reserva en ${complex.name}`,
              description: `Turno para el día ${format(
                bookingDate,
                "dd/MM/yyyy"
              )} a las ${time}hs`,
              quantity: 1,
              currency_id: "ARS",
              unit_price: depositAmount,
            },
          ],
          external_reference: pendingBooking.id,
          notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercado-pago`,
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/courts/${complexId}?status=success&booking_id=${pendingBooking.id}`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/courts/${complexId}?status=failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/courts/${complexId}?status=pending`,
          },
          auto_return: "approved",
        },
      });
      return NextResponse.json({ preferenceId: preference.id });
    } catch (mpError: unknown) {
      if (mpError instanceof Error) {
        const maybeWithCause = mpError as Error & {
          cause?: { message?: string } | { message?: string }[];
        };

        const errorMessage =
          Array.isArray(maybeWithCause.cause)
            ? maybeWithCause.cause[0]?.message
            : maybeWithCause.cause?.message ||
              mpError.message ||
              "Error al comunicarse con Mercado Pago.";

        await db.booking.delete({ where: { id: pendingBooking.id } });
        return new NextResponse(`Error de Mercado Pago: ${errorMessage}`, {
          status: 400,
        });
      }

      console.error("Error inesperado:", mpError);
      await db.booking.delete({ where: { id: pendingBooking.id } });
      return new NextResponse(
        "Error desconocido al comunicarse con Mercado Pago.",
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error en create-preference:", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}
