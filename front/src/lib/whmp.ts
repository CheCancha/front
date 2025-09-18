import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { BookingStatus } from "@prisma/client";
import SimpleCrypto from "simple-crypto-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, user_id } = body;

    if (type === "payment" && user_id) {
      const complex = await db.complex.findFirst({
        where: {
            mp_user_id: user_id.toString()
        },
        select: {
            mp_access_token: true
        }
      });

      if(!complex?.mp_access_token){
         console.error(`Webhook recibido para el usuario de MP ${user_id} pero no se encontró un complejo asociado o no tiene token.`);
         return new NextResponse("Complejo no encontrado", { status: 200 });
      }

      // 2. Desencriptamos el token y configuramos el cliente de MP.
      const secretKey = process.env.ENCRYPTION_KEY!;
      const crypto = new SimpleCrypto(secretKey);
      const accessToken = crypto.decrypt(complex.mp_access_token) as string;
      
      const client = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(client);
      
      // 3. Obtenemos los detalles completos del pago desde la API de Mercado Pago.
      const payment = await paymentClient.get({ id: data.id });
      
      // 4. Si el pago está aprobado y tiene nuestra referencia, actualizamos la reserva.
      if (payment && payment.status === "approved" && payment.external_reference) {
        const bookingId = payment.external_reference;


        await db.booking.update({
            where: { id: bookingId, status: BookingStatus.PENDIENTE },
            data: { status: BookingStatus.CONFIRMADO },
        });
        console.log(`Reserva ${bookingId} confirmada exitosamente via webhook.`);
      }
    }
    
    return new NextResponse("Notificación recibida", { status: 200 });

  } catch (error) {
    console.error("[MERCADOPAGO_WEBHOOK_POST]", error);
    return new NextResponse("Error procesando la notificación", { status: 500 });
  }
}

