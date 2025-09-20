import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { getMercadoPagoPreferenceClient } from "@/shared/lib/mercadopago";
import { format } from "date-fns";
import { BookingStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await req.json();
    const { complexId, courtId, date, time, price, depositAmount, guestName } = body;

    if (!userId && !guestName) {
      return new NextResponse("El nombre es requerido para los invitados", { status: 400 });
    }
    if (!complexId || !courtId || !date || !time || price === undefined || depositAmount === undefined) {
      return new NextResponse("Faltan datos para crear la reserva", { status: 400 });
    }

    const complex = await db.complex.findUnique({
      where: { id: complexId },
      select: { name: true, mp_access_token: true },
    });
    if (!complex?.mp_access_token) {
      return new NextResponse("El complejo no tiene configurado Mercado Pago.", { status: 400 });
    }

    const bookingDate = new Date(date);
    // ✨ CAMBIO: Ahora también parseamos los minutos
    const [hour, minute] = time.split(':').map(Number);

    const pendingBooking = await db.booking.create({
      data: {
        courtId,
        date: bookingDate,
        startTime: hour,      // Guardamos la hora
        startMinute: minute,  // Guardamos los minutos
        totalPrice: price,
        depositPaid: depositAmount,
        remainingBalance: price - depositAmount,
        status: BookingStatus.PENDIENTE,
        ...(userId ? { userId: userId } : { guestName: guestName }),
      },
    });

    const preferenceClient = getMercadoPagoPreferenceClient(complex.mp_access_token);
    
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

  } catch (error) {
    console.error("[CREATE_PREFERENCE_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}