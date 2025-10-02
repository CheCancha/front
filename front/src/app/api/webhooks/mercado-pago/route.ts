import { NextResponse, type NextRequest } from "next/server";

// ESTE ES UN WEBHOOK DE DIAGNÓSTICO. SU ÚNICA MISIÓN ES REGISTRAR UN LOG.
// No verifica firma, no parsea el body, no hace nada más.

export async function POST(req: NextRequest) {
  // --- PRUEBA DE VIDA ---
  // Si esta línea no aparece en los logs de Vercel después de un pago,
  // el problema es 100% de la infraestructura de Vercel y su timeout
  // en el plan gratuito, y ninguna optimización de código lo solucionará.
  console.log("¡SOBREVIVÍ! El webhook FANTASMA fue invocado.");

  // Respondemos 200 OK inmediatamente para cumplir con Mercado Pago.
  return new NextResponse("OK", { status: 200 });
}



// import { NextResponse, type NextRequest } from "next/server";
// import crypto from "crypto";

// type MercadoPagoWebhookBody = {
//   type: string;
//   data?: { id: string };
//   user_id?: number;
// };

// // La función de verificación de firma no cambia, es muy rápida.
// function verifySignature(request: NextRequest, body: string, secret: string): boolean {
//   try {
//     const signatureHeader = request.headers.get("x-signature");
//     if (!signatureHeader) return false;
//     const parts = signatureHeader.split(",").reduce((acc, part) => {
//       const [key, value] = part.split("=");
//       acc[key.trim()] = value.trim();
//       return acc;
//     }, {} as Record<string, string>);
//     const ts = parts.ts;
//     const signature = parts.v1;
//     if (!ts || !signature) return false;
//     const parsedBody = JSON.parse(body);
//     if (!parsedBody.data?.id) return true; // Es otro tipo de notificación
//     const manifest = `id:${parsedBody.data.id};ts:${ts};`;
//     const hmac = crypto.createHmac("sha256", secret);
//     hmac.update(manifest);
//     const ourSignature = hmac.digest("hex");
//     return crypto.timingSafeEqual(Buffer.from(ourSignature), Buffer.from(signature));
//   } catch {
//     return false;
//   }
// }

// // --- Handler principal ultrarrápido para Mercado Pago ---
// export async function POST(req: NextRequest) {
//   console.log("--- INICIANDO WEBHOOK RECEPTOR ---");
//   try {
//     const rawBody = await req.text();
//     console.log("Paso 1: Body recibido como texto.");
//     const body: MercadoPagoWebhookBody = JSON.parse(rawBody);
//     console.log("Paso 2: Body parseado a JSON.");

//     const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
//     if (secret && !verifySignature(req, rawBody, secret)) {
//       console.error("Fallo en la verificación de la firma. Petición ignorada.");
//       return new NextResponse("Firma inválida.", { status: 200 });
//     }
//     console.log("Paso 3: Verificación de firma completada.");

//     if (body.type === "payment" && body.data?.id) {
//       console.log("Paso 4: Es una notificación de pago. Preparando llamada interna...");
//       const internalApiUrl = new URL("/api/webhooks/process-payment", req.nextUrl.origin);

//       try {
//         fetch(internalApiUrl.toString(), {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "",
//           },
//           body: JSON.stringify({
//             paymentId: body.data.id,
//             userId: body.user_id,
//           }),
//         });
//         console.log("Paso 5: Llamada a la API interna DISPARADA (sin await).");
//       } catch (fetchError) {
//         console.error("💥 ERROR CRÍTICO AL INTENTAR LLAMAR A LA API INTERNA:", fetchError);
//       }
//     }

//     console.log("Paso 6: Respondiendo 200 OK a Mercado Pago.");
//     return new NextResponse("Notificación recibida y encolada.", { status: 200 });

//   } catch (error) {
//     console.error("💥 ERROR FATAL EN EL WEBHOOK RECEPTOR:", {
//       message: (error as Error).message,
//       stack: (error as Error).stack,
//     });
//     return new NextResponse("Cuerpo de la petición inválido o error fatal.", { status: 200 });
//   }
// }