import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

// --- Tipos de Datos (Sin 'any') ---
type MercadoPagoWebhookBody = {
  type: string;
  action: string;
  api_version: string;
  data?: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  user_id: number;
};

// --- Función de Verificación de Firma ---
function verifySignature(request: NextRequest, body: string, secret: string): boolean {
  try {
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

    const parsedBody = JSON.parse(body);
    if (!parsedBody.data?.id) {
        console.log("Notificación sin 'data.id', se omite la verificación para este evento.");
        return true;
    }

    const manifest = `id:${parsedBody.data.id};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(ourSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error("Error dentro de verifySignature:", error);
    return false;
  }
}

// --- Handler de la Ruta ---
export async function POST(req: NextRequest) {
  console.log("--- INVOCACIÓN DEL WEBHOOK RECIBIDA ---");
  console.log("Cabeceras recibidas:", Object.fromEntries(req.headers.entries()));

  let rawBody: string;
  try {
    rawBody = await req.text();
    console.log("Cuerpo crudo (rawBody) recibido:", rawBody);
    if (!rawBody) console.warn("El cuerpo de la petición está vacío.");
  } catch (err) {
    console.error("Error Crítico: No se pudo leer el cuerpo de la petición.", err);
    return new NextResponse("Petición ilegible.", { status: 200 });
  }

  // --- Verificación de la firma ---
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    if (verifySignature(req, rawBody, secret)) {
      console.log("Firma del Webhook verificada exitosamente.");
    } else {
      console.error("Fallo en la verificación de la firma del Webhook. Petición ignorada.");
    }
  }

  let body: unknown;
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      console.log("Detectado Content-Type: application/json. Parseando...");
      body = JSON.parse(rawBody);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      console.log("Detectado Content-Type: x-www-form-urlencoded. Parseando...");
      const params = new URLSearchParams(rawBody);
      // Corregido: Se elimina el 'any' explícito
      const parsedParams: Record<string, string | number> = {};
      params.forEach((value, key) => {
        if (!isNaN(Number(value)) && value.trim() !== "") {
            parsedParams[key] = Number(value);
        } else {
            parsedParams[key] = value;
        }
      });
      body = parsedParams;
    } else {
      console.warn(`Content-Type no esperado: ${contentType}. Intentando parsear como JSON.`);
      body = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error("Error al parsear el cuerpo crudo (rawBody):", err);
  }
  
  const typedBody = body as MercadoPagoWebhookBody;

  console.log("Cuerpo final parseado y tipado (typedBody):", typedBody);
  console.log("--- FIN DE LA INVOCACIÓN DEL WEBHOOK ---");

  return new NextResponse("Diagnóstico OK.", { status: 200 });
}

