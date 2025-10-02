import { NextResponse, type NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/shared/lib/db";
import SimpleCrypto from "simple-crypto-js";
import crypto from "crypto";

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

  // Recreamos el manifiesto que Mercado Pago firmó
  const manifest = `id:${JSON.parse(body).data.id};ts:${ts};`;

  // Calculamos nuestra propia firma HMAC
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const ourSignature = hmac.digest("hex");

  // Comparamos nuestra firma con la que vino en la cabecera
  return crypto.timingSafeEqual(
    Buffer.from(ourSignature),
    Buffer.from(signature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text(); // Leemos el body como texto para la firma
    const body = JSON.parse(rawBody);

    // --- NUEVO --- Bloque de Verificación de Seguridad
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret) {
      if (!verifySignature(req, rawBody, secret)) {
        console.error(
          "Fallo en la verificación de la firma del Webhook de Mercado Pago."
        );
        return new NextResponse("Firma inválida.", { status: 401 });
      }
      console.log("Firma del Webhook de Mercado Pago verificada exitosamente.");
    } else {
      console.warn(
        "MERCADOPAGO_WEBHOOK_SECRET no está configurada. Se omite la verificación de firma (NO SEGURO PARA PRODUCCIÓN)."
      );
    }

    const { type, data, user_id } = body;

    console.log("Mercado Pago Webhook received:", { type, data, user_id });

    if (type === "payment" && data?.id && user_id) {
      const complex = await db.complex.findFirst({
        where: { mp_user_id: user_id.toString() },
        select: { mp_access_token: true },
      });

      if (!complex?.mp_access_token) {
        console.warn(
          `Webhook for MP user ${user_id} received, but no complex with an associated token was found.`
        );
        return new NextResponse(
          "Notification received but no configured complex was found.",
          { status: 200 }
        );
      }

      const secretKey = process.env.ENCRYPTION_KEY;
      if (!secretKey) {
        console.error(
          "Critical error: ENCRYPTION_KEY is not defined on the server."
        );
        return new NextResponse("Server configuration error.", {
          status: 500,
        });
      }
      const crypto = new SimpleCrypto(secretKey);
      const accessToken = crypto.decrypt(complex.mp_access_token) as string;

      const dynamicClient = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(dynamicClient);

      const payment = await paymentClient.get({ id: data.id });
      console.log(
        `Payment details ${data.id} obtained with the complex's token.`
      );

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
            `Booking ${bookingId} updated to CONFIRMED with a payment of ${amountPaid}.`
          );
        } else {
          console.log(
            `Booking ${bookingId} not found or already processed. Current status: ${booking?.status}`
          );
        }
      } else {
        console.log(
          `Payment ${data.id} not approved or without external reference. Status: ${payment?.status}`
        );
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("[MERCADOPAGO_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
