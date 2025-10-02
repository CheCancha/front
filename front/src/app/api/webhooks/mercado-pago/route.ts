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
    console.log(`[VerifySignature] Cabecera x-signature: ${signatureHeader}`);
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
    console.log(`[VerifySignature] Timestamp (ts) extraído: ${ts}`);
    console.log(`[VerifySignature] Firma de MP (v1) extraída: ${signatureFromMP}`);

    if (!ts || !signatureFromMP) {
      console.warn("[VerifySignature] Firma de webhook mal formada.");
      return false;
    }

    const parsedBody = JSON.parse(body);
    if (!parsedBody.data?.id) {
        console.log("[VerifySignature] Notificación sin data.id, se omite la verificación.");
        return true;
    }

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // El formato del manifest debe ser "data.id:", no solo "id:".
    // Este era el bug que causaba el fallo en la firma.
    const manifest = `data.id:${parsedBody.data.id};ts:${ts};`;
    console.log(`[VerifySignature] Manifiesto construido: "${manifest}"`);
    
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");
    console.log(`[VerifySignature] Nuestra firma calculada: ${ourSignature}`);

    const signaturesMatch = crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signatureFromMP));
    console.log(`[VerifySignature] ¿Las firmas coinciden?: ${signaturesMatch}`);

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

    // Si la firma es válida, continuamos con la lógica de dos pasos
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