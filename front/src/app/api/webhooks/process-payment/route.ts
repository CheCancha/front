import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";

// ESTA ES UNA VERSIÓN DE AUDITORÍA. SU OBJETIVO ES REGISTRAR CADA PASO.
export async function POST(req: NextRequest) {
  console.log("\n\n--- [INICIO] API DE PROCESAMIENTO DE PAGO ---");
  try {
    const internalSecret = req.headers.get("X-Internal-Secret");
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      console.error("[PROCESS_FAIL] ¡FALLO DE CLAVE INTERNA! La llamada no es autorizada.");
      return new NextResponse("No autorizado.", { status: 401 });
    }
    console.log("[PROCESS_STEP] Clave interna verificada exitosamente.");

    const { paymentId, userId } = await req.json();
    if (!paymentId || !userId) {
      console.error("[PROCESS_FAIL] Faltan datos en el body (paymentId o userId).");
      return new NextResponse("Faltan datos.", { status: 400 });
    }
    console.log(`[PROCESS_STEP] Datos recibidos: paymentId=${paymentId}, userId=${userId}`);

    console.log("[PROCESS_STEP] Buscando complejo en la base de datos...");
    const complex = await db.complex.findFirst({
      where: { mp_user_id: userId.toString() },
      select: { mp_access_token: true },
    });

    if (!complex?.mp_access_token) {
      console.error(`[PROCESS_FAIL] No se encontró complejo o token para MP User ID: ${userId}`);
      return new NextResponse("Complejo no configurado.", { status: 200 });
    }
    console.log("[PROCESS_STEP] Complejo y token encontrados. Desencriptando...");

    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) throw new Error("ENCRYPTION_KEY no está definida.");
    
    const cryptoInstance = new SimpleCrypto(secretKey);
    const accessToken = cryptoInstance.decrypt(complex.mp_access_token) as string;
    console.log("[PROCESS_STEP] Token de acceso desencriptado. Consultando a Mercado Pago...");

    const dynamicClient = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(dynamicClient);
    const payment = await paymentClient.get({ id: paymentId });
    console.log(`[PROCESS_STEP] Detalles del pago obtenidos de MP. Estado: ${payment?.status}`);

    if (payment?.external_reference && payment.status === "approved") {
      const bookingId = payment.external_reference;
      const amountPaid = payment.transaction_amount || 0;
      console.log(`[PROCESS_STEP] Pago APROBADO. Buscando reserva PENDIENTE con ID: ${bookingId}`);
      
      const booking = await db.booking.findUnique({ where: { id: bookingId } });

      if (booking && booking.status === "PENDIENTE") {
        console.log(`[PROCESS_STEP] Reserva PENDIENTE encontrada. Actualizando a CONFIRMADO con ${amountPaid}...`);
        await db.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMADO",
            depositPaid: amountPaid,
            remainingBalance: booking.totalPrice - amountPaid,
            paymentId: String(payment.id),
          },
        });
        console.log(`[PROCESS_SUCCESS] ¡ÉXITO! Reserva ${bookingId} actualizada.`);
      } else {
        console.warn(`[PROCESS_WARN] La reserva ${bookingId} no se actualizó. Razón: No encontrada o su estado no era PENDIENTE (Estado actual: ${booking?.status})`);
      }
    } else {
      console.warn(`[PROCESS_WARN] El pago ${paymentId} no fue procesado. Razón: No está aprobado o no tiene referencia externa (Estado actual: ${payment?.status})`);
    }
    
    console.log("--- [FIN] API DE PROCESAMIENTO DE PAGO ---");
    return new NextResponse("Procesamiento completado.", { status: 200 });

  } catch (error) {
    console.error("💥 ERROR FATAL en la API de procesamiento:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    console.log("--- [FIN CON ERROR] API DE PROCESAMIENTO DE PAGO ---");
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}