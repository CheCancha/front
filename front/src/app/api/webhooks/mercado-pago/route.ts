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
    // 1. Extraemos TODAS las cabeceras necesarias
    const signatureHeader = request.headers.get("x-signature");
    const requestIdHeader = request.headers.get("x-request-id");
    console.log(`[VerifySignature] Cabecera x-signature: ${signatureHeader}`);
    console.log(`[VerifySignature] Cabecera x-request-id: ${requestIdHeader}`);

    if (!signatureHeader || !requestIdHeader) {
      console.warn("[VerifySignature] Faltan cabeceras de seguridad (x-signature o x-request-id).");
      return false;
    }

    // 2. Extraemos el timestamp y la firma de la cabecera x-signature
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

    if (!resourceId) {
      console.log("[VerifySignature] Notificación sin 'data.id', se omite la verificación para este evento.");
      return true;
    }

    // --- ¡AQUÍ ESTÁ LA LÓGICA FINAL Y CORRECTA! ---
    // El manifiesto oficial incluye 'data.id', el 'x-request-id' y el 'ts'.
    const manifest = `data.id:${resourceId};request-id:${requestIdHeader};ts:${ts};`;
    console.log(`[VerifySignature] Manifiesto construido (LÓGICA OFICIAL): "${manifest}"`);
    
    // 4. Calculamos nuestra firma con el manifiesto correcto
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");
    console.log(`[VerifySignature] Nuestra firma calculada: ${ourSignature}`);

    // 5. Comparamos de forma segura
    const signaturesMatch = crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signatureFromMP));
    console.log(`[VerifySignature] ¿Las firmas coinciden?: ${signaturesMatch}`);

    return signaturesMatch;
  } catch (error) {
    console.error("[VerifySignature] Error fatal durante la verificación:", error);
    return false;
  }
}

// El resto del archivo (la función POST) no necesita cambios.
// Sigue usando la arquitectura de dos pasos que ya teníamos.
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