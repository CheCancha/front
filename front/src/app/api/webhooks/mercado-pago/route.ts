import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

type MercadoPagoWebhookBody = {
  id?: number;
  type: string;
  data?: { id: string };
  user_id?: number;
};

// --- FUNCIÓN DE VERIFICACIÓN DE FIRMA (VERSIÓN FINAL Y CORRECTA) ---
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

    const parsedBody: MercadoPagoWebhookBody = JSON.parse(body);
    const resourceId = parsedBody.data?.id;
    const userId = parsedBody.user_id;

    if (!resourceId || !userId) {
      console.log("[VerifySignature] Notificación sin 'data.id' o 'user_id', se omite la verificación.");
      return true;
    }

    // --- ¡LA LÓGICA FINAL BASADA EN LA DOCUMENTACIÓN OFICIAL! ---
    // El manifiesto incluye 'id' (del recurso), 'request-id', 'ts', y 'user-id'.
    const manifest = `id:${resourceId};request-id:${requestIdHeader};ts:${ts};user-id:${userId};`;
    console.log(`[VerifySignature] Manifiesto construido (LÓGICA OFICIAL): "${manifest}"`);
    
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");
    console.log(`[VerifySignature] Nuestra firma calculada: ${ourSignature}`);
    console.log(`[VerifySignature] Firma de MP recibida: ${signatureFromMP}`);

    const signaturesMatch = crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signatureFromMP));
    console.log(`[VerifySignature] ¿Las firmas coinciden?: ${signaturesMatch}`);

    return signaturesMatch;
  } catch (error) {
    console.error("[VerifySignature] Error fatal durante la verificación:", error);
    return false;
  }
}

// El resto de la función POST no necesita cambios
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body: MercadoPagoWebhookBody = JSON.parse(rawBody);

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret && !verifySignature(req, rawBody, secret)) {
      console.error("Fallo en la verificación de la firma. Petición ignorada.");
      return new NextResponse("Firma inválida.", { status: 200 });
    }

    if (body.type === "payment" && body.data?.id) {
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
      }).catch(error => {
        console.error("Error al disparar la llamada interna:", error);
      });
    }

    return new NextResponse("Notificación encolada.", { status: 200 });
  } catch (error) {
    console.error("Error fatal en el webhook receptor:", error);
    return new NextResponse("Error procesando la petición.", { status: 200 });
  }
}