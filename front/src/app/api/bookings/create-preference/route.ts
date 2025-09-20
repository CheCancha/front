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

    if (!complex) {
        return new NextResponse("Complejo no encontrado.", { status: 404 });
    }

    let accessToken = "";
    if (complex.mp_access_token) {
        const secretKey = process.env.ENCRYPTION_KEY!;
        const crypto = new SimpleCrypto(secretKey);
        accessToken = crypto.decrypt(complex.mp_access_token) as string;
        console.log("Usando Access Token del complejo (producción).");
    } else {
        accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
        console.log("Usando Access Token de prueba (fallback).");
        if (!accessToken) {
            return new NextResponse("El complejo no tiene Mercado Pago configurado y no hay token de prueba.", { status: 400 });
        }
    }
    
    const bookingDate = new Date(date);
    const [hour, minute] = time.split(':').map(Number);

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