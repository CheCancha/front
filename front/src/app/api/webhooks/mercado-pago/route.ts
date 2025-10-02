import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

type MercadoPagoWebhookBody = {
  type: string;
  data?: { id: string };
  user_id?: number;
};

// La función de verificación de firma no cambia, es muy rápida.
function verifySignature(request: NextRequest, body: string, secret: string): boolean {
  try {
    const signatureHeader = request.headers.get("x-signature");
    if (!signatureHeader) return false;
    const parts = signatureHeader.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
    const ts = parts.ts;
    const signature = parts.v1;
    if (!ts || !signature) return false;
    const parsedBody = JSON.parse(body);
    if (!parsedBody.data?.id) return true; // Es otro tipo de notificación
    const manifest = `id:${parsedBody.data.id};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");
    return crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}

// --- Handler principal ultrarrápido ---
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body: MercadoPagoWebhookBody = JSON.parse(rawBody);

    // 1. Verificación de seguridad inmediata
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret && !verifySignature(req, rawBody, secret)) {
      console.error("Fallo en la verificación de la firma. Petición ignorada.");
      // Respondemos OK para que MP no reintente con una firma inválida.
      return new NextResponse("Firma inválida.", { status: 200 });
    }

    // 2. Si es una notificación de pago, disparamos la tarea de fondo
    if (body.type === "payment" && body.data?.id) {
      const internalApiUrl = new URL(
        "/api/webhooks/process-payment",
        req.nextUrl.origin
      );

      // Usamos fetch para llamar a nuestra propia API interna.
      // NO usamos 'await' para que esta función responda de inmediato.
      fetch(internalApiUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Añadimos una cabecera de seguridad para que solo nuestra app pueda llamar a la API interna
          "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          paymentId: body.data.id,
          userId: body.user_id,
        }),
      });
    }

    // 3. Respondemos 200 OK a Mercado Pago INMEDIATAMENTE
    return new NextResponse("Notificación recibida y encolada.", { status: 200 });
  } catch (error) {
    console.error("Error inicial en el webhook receptor:", error);
    // En caso de error de parseo, también respondemos 200 para evitar reintentos infinitos.
    return new NextResponse("Cuerpo de la petición inválido.", { status: 200 });
  }
}

