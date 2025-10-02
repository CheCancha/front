import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";

// ESTE ES UN WEBHOOK DE AUDITORÍA EXTREMA.
// SU ÚNICO PROPÓSITO ES REGISTRAR CADA DETALLE DE LA PETICIÓN ENTRANTE.

export async function POST(req: NextRequest) {
  console.log("\n\n--- [INICIO DE AUDITORÍA DE WEBHOOK] ---");
  console.log(`[AUDIT] Hora de Invocación: ${new Date().toISOString()}`);

  try {
    // --- 1. AUDITORÍA DE CABECERAS ---
    console.log("[AUDIT] Cabeceras completas recibidas:");
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(JSON.stringify(headers, null, 2));

    // --- 2. LECTURA DEL CUERPO CRUDO ---
    const rawBody = await req.text();
    console.log(`[AUDIT] Cuerpo crudo (rawBody) recibido (longitud: ${rawBody.length}):`);
    console.log(rawBody);

    // --- 3. PARSEO DEL CUERPO ---
    const parsedBody = JSON.parse(rawBody);
    console.log("[AUDIT] Cuerpo parseado a JSON:");
    console.log(JSON.stringify(parsedBody, null, 2));

    // --- 4. EXTRACCIÓN DE DATOS PARA LA FIRMA ---
    console.log("\n--- [INICIO DE VERIFICACIÓN DE FIRMA] ---");
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET || "SECRET_NO_CONFIGURADA";
    const signatureHeader = req.headers.get("x-signature") || "HEADER_NO_ENCONTRADO";
    const requestIdHeader = req.headers.get("x-request-id") || "HEADER_NO_ENCONTRADO";

    console.log(`[SIGNATURE_DATA] Clave Secreta leída (longitud: ${secret.length}): "${secret}"`);
    console.log(`[SIGNATURE_DATA] Cabecera x-signature: "${signatureHeader}"`);
    console.log(`[SIGNATURE_DATA] Cabecera x-request-id: "${requestIdHeader}"`);

    const parts = signatureHeader.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
    const ts = parts.ts;
    const signatureFromMP = parts.v1;
    const resourceId = parsedBody.data?.id;

    console.log(`[SIGNATURE_DATA] Timestamp (ts) extraído: "${ts}"`);
    console.log(`[SIGNATURE_DATA] ID del Recurso (data.id) extraído: "${resourceId}"`);

    if (!ts || !signatureFromMP || !resourceId || !requestIdHeader) {
      console.error("[VERIFICATION_FAIL] Faltan componentes esenciales para verificar la firma. Abortando.");
      return new NextResponse("Componentes de firma faltantes.", { status: 200 });
    }
    
    // --- 5. CONSTRUCCIÓN Y CÁLCULO DEL MANIFIESTO ---
    const manifest = `id:${resourceId};request-id:${requestIdHeader};ts:${ts};`;
    console.log(`[SIGNATURE_CALC] Manifiesto construido: "${manifest}"`);

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const ourSignature = hmac.digest("hex");
    
    console.log(`[SIGNATURE_RESULT] Nuestra Firma Calculada: ${ourSignature}`);
    console.log(`[SIGNATURE_RESULT] Firma de MP Recibida:   ${signatureFromMP}`);
    
    const signaturesMatch = crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signatureFromMP));

    if (signaturesMatch) {
      console.log("[SIGNATURE_SUCCESS] ¡¡¡LAS FIRMAS COINCIDEN!!! La verificación es exitosa.");
      // Aquí iría la lógica para llamar a processPayment...
    } else {
      console.error("[SIGNATURE_FAIL] ¡¡¡FALLO DE FIRMA!!! Las firmas no coinciden.");
    }

    console.log("--- [FIN DE AUDITORÍA] ---");
    return new NextResponse("Auditoría completada.", { status: 200 });

  } catch (error) {
    console.error("💥 ERROR FATAL DURANTE LA AUDITORÍA:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
    console.log("--- [FIN DE AUDITORÍA CON ERROR] ---");
    return new NextResponse("Error durante la auditoría.", { status: 200 });
  }
}

