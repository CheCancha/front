import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";

// Versión final y limpia para producción.
export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get("X-Internal-Secret");
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      console.warn("[ProcessPayment] Intento de acceso no autorizado.");
      return new NextResponse("No autorizado.", { status: 401 });
    }

    const { paymentId, userId } = await req.json();
    if (!paymentId || !userId) {
      console.error("[ProcessPayment] Faltan datos en el body (paymentId o userId).");
      return new NextResponse("Faltan datos.", { status: 400 });
    }

    const complex = await db.complex.findFirst({
      where: { mp_user_id: userId.toString() },
      select: { mp_access_token: true },
    });

    if (!complex?.mp_access_token) {
      console.warn(`[ProcessPayment] No se encontró complejo o token para MP User ID: ${userId}`);
      return new NextResponse("Complejo no configurado.", { status: 200 });
    }

    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) throw new Error("ENCRYPTION_KEY no está definida.");
    
    const cryptoInstance = new SimpleCrypto(secretKey);
    const accessToken = cryptoInstance.decrypt(complex.mp_access_token) as string;

    const dynamicClient = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(dynamicClient);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment?.external_reference && payment.status === "approved") {
      const bookingId = payment.external_reference;
      const amountPaid = payment.transaction_amount || 0;
      
      const booking = await db.booking.findUnique({ where: { id: bookingId } });

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
        console.log(`[ProcessPayment] Reserva ${bookingId} actualizada a CONFIRMADO.`);
      } else {
        console.warn(`[ProcessPayment] La reserva ${bookingId} no se actualizó. Razón: No encontrada o su estado no era PENDIENTE (Estado actual: ${booking?.status})`);
      }
    } else {
      console.warn(`[ProcessPayment] El pago ${paymentId} no fue procesado. Razón: No está aprobado o no tiene referencia externa (Estado actual: ${payment?.status})`);
    }
    
    return new NextResponse("Procesamiento completado.", { status: 200 });

  } catch (error) {
    console.error("💥 ERROR FATAL en la API de procesamiento:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}