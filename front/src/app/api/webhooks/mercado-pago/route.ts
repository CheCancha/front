import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Extraemos el user_id del vendedor, que es clave para la lógica multi-vendedor.
    const { type, data, user_id } = body;

    console.log("Webhook de Mercado Pago recibido:", { type, data, user_id });

    // Solo procesamos notificaciones de pagos que incluyan el ID del vendedor.
    if (type === "payment" && data?.id && user_id) {
      // 1. Buscamos el complejo asociado a la cuenta de Mercado Pago del vendedor.
      const complex = await db.complex.findFirst({
        where: { mp_user_id: user_id.toString() },
        select: { mp_access_token: true },
      });

      // Si no encontramos el complejo o no tiene un token, no podemos verificar el pago.
      // Respondemos 200 para que MP no reintente, pero registramos el problema.
      if (!complex?.mp_access_token) {
        console.warn(
          `Webhook para usuario de MP ${user_id} recibido, pero no se encontró un complejo con token asociado.`
        );
        return new NextResponse(
          "Notificación recibida pero no se encontró complejo configurado.",
          { status: 200 }
        );
      }

      // 2. Desencriptamos el Access Token específico de ESE complejo.
      const secretKey = process.env.ENCRYPTION_KEY;
      if (!secretKey) {
        console.error(
          "Error crítico: ENCRYPTION_KEY no está definida en el servidor."
        );
        return new NextResponse("Error de configuración del servidor.", {
          status: 500,
        });
      }
      const crypto = new SimpleCrypto(secretKey);
      const accessToken = crypto.decrypt(complex.mp_access_token) as string;

      // 3. Creamos un cliente de Mercado Pago DINÁMICO con el token del vendedor.
      const dynamicClient = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(dynamicClient);

      // 4. Obtenemos los detalles del pago usando el cliente correcto.
      const payment = await paymentClient.get({ id: data.id });
      console.log(
        `Detalles del pago ${data.id} obtenidos con el token del complejo.`
      );

      // 5. Si el pago está aprobado, actualizamos la reserva en nuestra base de datos.
      if (
        payment &&
        payment.external_reference &&
        payment.status === "approved"
      ) {
        const bookingId = payment.external_reference;
        const amountPaid = payment.transaction_amount || 0;

        const booking = await db.booking.findUnique({
          where: { id: bookingId },
        });

        if (booking && booking.status === "PENDIENTE") {
          await db.booking.update({
            where: { id: bookingId },
            data: {
              status: "CONFIRMADO",
              depositPaid: amountPaid,
              remainingBalance: booking.totalPrice - amountPaid,
              paymentId: String(payment.id),
            },
          });
          console.log(
            `Reserva ${bookingId} actualizada a CONFIRMADO con un pago de ${amountPaid}.`
          );
        } else {
          console.log(
            `Reserva ${bookingId} no encontrada o ya procesada. Estado actual: ${booking?.status}`
          );
        }
      } else {
        console.log(
          `Pago ${data.id} no aprobado o sin referencia externa. Estado: ${payment?.status}`
        );
      }
    }

    return new NextResponse("Webhook procesado", { status: 200 });
  } catch (error) {
    console.error("[MERCADOPAGO_WEBHOOK_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
