import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { db } from "@/shared/lib/db";
import { add } from "date-fns";

type MercadoPagoWebhookBody = {
  type: string;
  data?: { id: string };
  user_id?: number;
};

type PreApprovalResponse = {
  id: string;
  status: "authorized" | "cancelled" | "paused" | "rejected" | string;
  preapproval_plan_id?: string;
};

function verifySignature(request: NextRequest, body: string, secret: string): boolean {
  try {
    const signatureHeader = request.headers.get("x-signature");
    const requestIdHeader = request.headers.get("x-request-id");

    if (!signatureHeader || !requestIdHeader) {
      console.warn("[VerifySignature] Faltan cabeceras de seguridad.");
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

    const parsedBody = JSON.parse(body);
    const resourceId = parsedBody.data?.id;

    if (!resourceId) {
      console.log("[VerifySignature] Notificación sin 'data.id', se omite la verificación.");
      return true;
    }

    const manifest = `id:${resourceId};request-id:${requestIdHeader};ts:${ts};`;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(ourSignature),
      Buffer.from(signatureFromMP)
    );

    if (!signaturesMatch) {
      console.error(
        `¡FALLO DE FIRMA! Manifiesto: "${manifest}", Nuestra Firma: ${ourSignature}, Firma MP: ${signatureFromMP}`
      );
    }

    return signaturesMatch;
  } catch (error) {
    console.error("[VerifySignature] Error fatal durante la verificación:", error);
    return false;
  }
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body: MercadoPagoWebhookBody = JSON.parse(rawBody);

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret && !verifySignature(req, rawBody, secret)) {
      console.error("Fallo en la verificación de la firma del webhook. Petición ignorada.");
      return new NextResponse("Firma inválida.", { status: 200 });
    }
    console.log("Firma del Webhook verificada exitosamente.");

    // --- ROUTER INTELIGENTE DE WEBHOOKS ---

    // 1. LÓGICA PARA PAGOS DE RESERVAS
    if (body.type === "payment" && body.data?.id && body.user_id) {
      console.log(`Webhook recibido: Procesando pago de reserva ${body.data.id}`);

      const internalApiUrl = new URL("/api/webhooks/process-payment", req.nextUrl.origin);
      fetch(internalApiUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          paymentId: body.data.id,
          userId: body.user_id,
        }),
      }).catch((error) => {
        console.error("Error al disparar la llamada interna a process-payment:", error);
      });
    }

    // 2. LÓGICA PARA SUSCRIPCIONES
    else if (
      (body.type === "subscription_preapproval" || body.type === "preapproval") &&
      body.data?.id
    ) {
      const subscriptionId = body.data.id;

      const preapprovalClient = new PreApproval(client);
      const subscription = (await preapprovalClient.get({ id: subscriptionId })) as PreApprovalResponse;

      if (!subscription) {
        console.error(`[Webhook] Suscripción con ID ${subscriptionId} no encontrada en Mercado Pago.`);
        return new NextResponse("Suscripción no encontrada", { status: 200 });
      }

      const complex = await db.complex.findFirst({
        where: { mp_subscription_id: subscription.id },
      });

      if (!complex) {
        console.warn(`[Webhook] Complejo no encontrado para suscripción ${subscription.id}`);
        return new NextResponse("Complejo no encontrado", { status: 200 });
      }

      if (subscription.status === "authorized") {
        const planDetails = await db.subscriptionPlanDetails.findFirst({
          where: { mp_plan_id: subscription.preapproval_plan_id },
        });

        await db.complex.update({
          where: { id: complex.id },
          data: {
            subscriptionStatus: "ACTIVA",
            subscriptionPlan: planDetails?.plan,
            subscriptionCycle: planDetails?.cycle,
            subscribedAt: complex.subscribedAt || new Date(),
            currentPeriodEndsAt: add(new Date(), {
              [planDetails?.cycle === "MENSUAL" ? "months" : "years"]: 1,
            }),
          },
        });

        console.log(`[Webhook] Suscripción de complejo ${complex.id} actualizada a ACTIVA.`);
      } else if (
        subscription.status === "cancelled" ||
        subscription.status === "paused" ||
        subscription.status === "rejected"
      ) {
        await db.complex.update({
          where: { id: complex.id },
          data: { subscriptionStatus: "CANCELADA" },
        });

        console.log(`[Webhook] Suscripción de complejo ${complex.id} actualizada a CANCELADA.`);
      }
    }

    return new NextResponse("Notificación recibida.", { status: 200 });
  } catch (error) {
    console.error("Error fatal en el webhook receptor:", error);
    return new NextResponse("Error procesando la petición.", { status: 200 });
  }
}