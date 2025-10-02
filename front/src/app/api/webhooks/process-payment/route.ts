import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";

// --- Lógica de procesamiento de pagos (trabajo pesado) ---
export async function POST(req: NextRequest) {
  console.log("--- INICIANDO API DE PROCESAMIENTO DE PAGO ---");

  try {
    const internalSecret = req.headers.get("X-Internal-Secret");
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      console.warn("Intento de acceso no autorizado a la API de procesamiento.");
      return new NextResponse("No autorizado.", { status: 401 });
    }
    console.log("Clave interna verificada.");

    const { paymentId, userId } = await req.json();
    if (!paymentId || !userId) {
      return new NextResponse("Faltan datos (paymentId, userId).", { status: 400 });
    }

    console.log(`Procesando pago ${paymentId} para MP User ID ${userId}...`);

    // 2. Aquí va toda la lógica que antes fallaba por timeout
    const complex = await db.complex.findFirst({
      where: { mp_user_id: userId.toString() },
      select: { mp_access_token: true },
    });

    if (!complex?.mp_access_token) {
      console.warn(`No se encontró complejo para MP User ID: ${userId}`);
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
        console.log(`ÉXITO: Reserva ${bookingId} actualizada a CONFIRMADO.`);
      }
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
