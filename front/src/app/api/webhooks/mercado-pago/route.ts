import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

type MercadoPagoWebhookBody = {
  type: string;
  data?: { id: string };
  user_id?: number;
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

    // --- LA FÓRMULA GANADORA ---
    const manifest = `id:${resourceId};request-id:${requestIdHeader};ts:${ts};`;
    
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");

    const signaturesMatch = crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signatureFromMP));
    
    if (!signaturesMatch) {
      console.error(`¡FALLO DE FIRMA! Manifiesto: "${manifest}", Nuestra Firma: ${ourSignature}, Firma MP: ${signatureFromMP}`);
    }

    return signaturesMatch;
  } catch (error) {
    console.error("[VerifySignature] Error fatal durante la verificación:", error);
    return false;
  }
}

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
      const internalApiUrl = new URL("/api/webhooks/process-payment", req.nextUrl.origin);

      // Usamos fetch para llamar a nuestra propia API interna, sin esperar.
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
      }).catch(error => {
        console.error("Error al disparar la llamada interna a process-payment:", error);
      });

      console.log(`Llamada interna para procesar el pago ${body.data.id} disparada.`);
    }

    return new NextResponse("Notificación recibida.", { status: 200 });
  } catch (error) {
    console.error("Error fatal en el webhook receptor:", error);
    return new NextResponse("Error procesando la petición.", { status: 200 });
  }
}