import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";

type MercadoPagoWebhookBody = {
  id?: number;
  type: string;
  data?: { id: string };
  user_id?: number;
};

// --- FUNCIÓN DE VERIFICACIÓN DE FIRMA (VERSIÓN CORREGIDA FINAL) ---
function verifySignature(request: NextRequest, body: string, secret: string): boolean {
  try {
    const signatureHeader = request.headers.get("x-signature");
    if (!signatureHeader) {
      console.warn("[VerifySignature] Webhook sin firma recibido.");
      return false;
    }

    const parts = signatureHeader.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
    const ts = parts.ts;
    const signatureFromMP = parts.v1;

    if (!ts || !signatureFromMP) {
      console.warn("[VerifySignature] Firma de webhook mal formada.");
      return false;
    }

    const parsedBody: MercadoPagoWebhookBody = JSON.parse(body);

    if (!parsedBody.id) {
      console.log("[VerifySignature] Notificación sin 'id' en la raíz. Se omite verificación para este evento.");
      return true;
    }

    const manifest = `id:${parsedBody.id};ts:${ts}`
    
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");

    const signaturesMatch = crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signatureFromMP));
    
    if (!signaturesMatch) {
      console.error(`[VerifySignature] ¡FALLO DE FIRMA! Manifiesto: "${manifest}", Nuestra Firma: ${ourSignature}, Firma MP: ${signatureFromMP}`);
    }

    return signaturesMatch;
  } catch (error) {
    console.error("[VerifySignature] Error fatal durante la verificación:", error);
    return false;
  }
}

// --- PROCESADOR DE PAGOS (TRABAJO PESADO) ---
async function processPayment(paymentId: string, userId: number) {
    console.log(`[ProcessPayment] Iniciando procesamiento para pago ${paymentId}`);
    try {
        const complex = await db.complex.findFirst({
            where: { mp_user_id: userId.toString() },
            select: { mp_access_token: true },
        });

        if (!complex?.mp_access_token) {
            console.warn(`[ProcessPayment] No se encontró complejo para MP User ID: ${userId}`);
            return;
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
                console.log(`[ProcessPayment] ¡ÉXITO! Reserva ${bookingId} actualizada a CONFIRMADO.`);
            }
        }
    } catch (error) {
        console.error("[ProcessPayment] 💥 ERROR FATAL durante el procesamiento del pago:", error);
    }
}

// --- HANDLER PRINCIPAL ---
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body: MercadoPagoWebhookBody = JSON.parse(rawBody);

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret && !verifySignature(req, rawBody, secret)) {
      console.error("Fallo en la verificación de la firma. Petición ignorada.");
      return new NextResponse("Firma inválida.", { status: 200 });
    }
    console.log("Firma del Webhook verificada exitosamente.");

    if (body.type === "payment" && body.data?.id && body.user_id) {
      processPayment(body.data.id, body.user_id);
    }

    return new NextResponse("Notificación recibida.", { status: 200 });
  } catch (error) {
    console.error("Error fatal en el webhook receptor:", error);
    return new NextResponse("Error procesando la petición.", { status: 200 });
  }
}