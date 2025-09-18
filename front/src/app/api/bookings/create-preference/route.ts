import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { getMercadoPagoPreferenceClient } from "@/lib/mercadopago";
import { format } from "date-fns";
import { BookingStatus } from "@prisma/client";

/**
 * Crea una preferencia de pago en Mercado Pago para una nueva reserva.
 * Esta ruta es llamada por el BookingModal cuando el usuario decide pagar la seña.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { complexId, courtId, date, time, price, depositAmount } = body;

    if (!complexId || !courtId || !date || !time || price === undefined || depositAmount === undefined) {
      return new NextResponse("Faltan datos para crear la reserva", { status: 400 });
    }

    // 1. Buscamos el complejo para obtener su Access Token de Mercado Pago.
    const complex = await db.complex.findUnique({
      where: { id: complexId },
      select: { name: true, mp_access_token: true },
    });

    if (!complex?.mp_access_token) {
      return new NextResponse("El complejo no tiene configurado Mercado Pago.", { status: 400 });
    }

    // 2. Creamos un registro de reserva PENDIENTE en nuestra base de datos.
    const bookingDate = new Date(date);
    const startTime = parseInt(time.split(":")[0]);

    const pendingBooking = await db.booking.create({
      data: {
        userId: session.user.id,
        courtId,
        date: bookingDate,
        startTime,
        totalPrice: price,
        depositPaid: depositAmount,
        remainingBalance: price - depositAmount,
        status: BookingStatus.PENDIENTE, // Usamos el enum de Prisma
      },
    });

    // 3. Inicializamos el cliente de Mercado Pago con el token del complejo.
    const preferenceClient = getMercadoPagoPreferenceClient(complex.mp_access_token);
    
    // 4. Creamos la preferencia de pago usando la nueva sintaxis del SDK.
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: courtId,
            title: `Seña para reserva en ${complex.name}`,
            description: `Turno para el día ${format(bookingDate, "dd/MM/yyyy")} a las ${time}hs`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: depositAmount,
          },
        ],
        // Usamos el ID de nuestra reserva pendiente como referencia externa.
        external_reference: pendingBooking.id,
        // URL a la que Mercado Pago enviará las notificaciones de pago (webhooks).
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercado-pago`,
        // URLs para redirigir al usuario después del pago.
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/courts/${complexId}?status=success&booking_id=${pendingBooking.id}`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/courts/${complexId}?status=failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/courts/${complexId}?status=pending`,
        },
        auto_return: "approved", // Redirige automáticamente solo si el pago es aprobado.
      },
    });

    // 5. Devolvemos el ID de la preferencia al frontend para que renderice el checkout.
    return NextResponse.json({ preferenceId: preference.id });

  } catch (error) {
    console.error("[CREATE_PREFERENCE_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

