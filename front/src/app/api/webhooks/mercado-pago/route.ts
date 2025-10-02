import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";
import crypto from "crypto";

// --- NUEVO --- Tipo para el cuerpo de la notificación del Webhook
type MercadoPagoWebhookBody = {
  type: string;
  data?: {
    id: string;
  };
  user_id?: number;
};

// La función de verificación de firma no cambia
function verifySignature(
  request: NextRequest,
  body: string,
  secret: string
): boolean {
  const signatureHeader = request.headers.get("x-signature");
  if (!signatureHeader) {
    console.warn("No se encontró la cabecera x-signature en el webhook.");
    return false;
  }

  const parts = signatureHeader.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);

  const ts = parts.ts;
  const signature = parts.v1;

  if (!ts || !signature) {
    console.warn("Faltan 'ts' o 'v1' en la cabecera x-signature.");
    return false;
  }

  const manifest = `id:${JSON.parse(body).data.id};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const ourSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(ourSignature),
    Buffer.from(signature)
  );
}

// --- Lógica principal separada con el tipo correcto ---
async function processWebhookLogic(
  body: MercadoPagoWebhookBody, // <-- Se usa el nuevo tipo
  rawBody: string,
  req: NextRequest
) {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret) {
      if (!verifySignature(req, rawBody, secret)) {
        console.error("Fallo en la verificación de la firma del Webhook.");
        return; // Salimos si la firma es inválida
      }
      console.log("Firma del Webhook verificada exitosamente.");
    } else {
      console.warn(
        "MERCADOPAGO_WEBHOOK_SECRET no configurada. (NO SEGURO PARA PRODUCCIÓN)."
      );
    }

    const { type, data, user_id } = body;
    console.log("Procesando webhook en segundo plano:", { type, data, user_id });

    if (type === "payment" && data?.id && user_id) {
      const complex = await db.complex.findFirst({
        where: { mp_user_id: user_id.toString() },
        select: { mp_access_token: true },
      });

      if (!complex?.mp_access_token) {
        console.warn(
          `Webhook para usuario de MP ${user_id} recibido, pero no se encontró un complejo con token asociado.`
        );
        return;
      }

      const secretKey = process.env.ENCRYPTION_KEY;
      if (!secretKey) {
        console.error("Error crítico: ENCRYPTION_KEY no está definida.");
        return;
      }
      const cryptoInstance = new SimpleCrypto(secretKey);
      const accessToken = cryptoInstance.decrypt(
        complex.mp_access_token
      ) as string;

      const dynamicClient = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(dynamicClient);
      const payment = await paymentClient.get({ id: data.id });
      console.log(`Detalles del pago ${data.id} obtenidos.`);

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
            `ÉXITO: Reserva ${bookingId} actualizada a CONFIRMADO.`
          );
        }
      }
    }
  } catch (error) {
    console.error("💥 ERROR procesando el webhook en segundo plano:", error);
  }
}

// --- Handler principal que responde inmediatamente ---
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    processWebhookLogic(body, rawBody, req);

    console.log("Webhook recibido. Respondiendo 200 OK inmediatamente.");
    return new NextResponse("Webhook encolado para procesamiento.", {
      status: 200,
    });
  } catch (error) {
    console.error("[MERCADOPAGO_WEBHOOK_ERROR INICIAL]", error);
    return new NextResponse("Error al recibir el webhook.", { status: 500 });
  }
}