import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/shared/lib/db";
import { inscriptionSchema } from "@/shared/lib/inscriptionSchema";
import { normalizePhoneNumber } from "@/shared/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

const createConfirmationEmailHtml = (ownerName: string) => {
  const brandColor = "#fe4321"; //brand-orange
  const baseURL = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const logoUrl = `${baseURL}/checanchalogo.png`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background-color: ${brandColor}; padding: 20px; text-align: center; }
        .content { padding: 32px; color: #333d47; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body style="background-color: #f1f5f9; padding: 20px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="CheCancha Logo" width="150">
              </div>
              <div class="content">
                <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #0f172a;">¡Hemos recibido tu solicitud!</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hola ${ownerName},</p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Gracias por registrar tu complejo en CheCancha. Nuestro equipo está revisando tu solicitud y nos pondremos en contacto contigo a la brevedad para confirmar los próximos pasos.</p>
                <p style="font-size: 16px; line-height: 1.6;">¡Estamos muy contentos de que te sumes a nuestra comunidad!</p>
              </div>
              <div class="footer">
                © ${new Date().getFullYear()} CheCancha. Todos los derechos reservados.
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = inscriptionSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.flatten()), {
        status: 400,
      });
    }

    const {
      ownerName,
      ownerEmail,
      ownerPhone,
      complexName,
      address,
      city,
      province,
      sports,
      selectedPlan,
      selectedCycle,
    } = validation.data;

    await db.inscriptionRequest.create({
      data: {
        ownerName,
        ownerEmail,
        ownerPhone: normalizePhoneNumber(ownerPhone),
        complexName,
        address,
        city,
        province,
        sports,
        selectedPlan,
        selectedCycle,
        status: "PENDIENTE",
      },
    });

    await resend.emails.send({
      from: "contacto@checancha.com",
      to: "ignacionweppler@gmail.com",
      subject: `Nueva solicitud de registro: ${complexName}`,
      html: `
        <h1>Nueva Solicitud de Complejo</h1>
        <p><strong>Nombre del Complejo:</strong> ${complexName}</p>
        <p><strong>Nombre del Dueño:</strong> ${ownerName}</p>
        <p><strong>Email:</strong> ${ownerEmail}</p>
        <p><strong>Teléfono:</strong> ${ownerPhone}</p>
        <p><strong>Plan Seleccionado:</strong> ${selectedPlan} (${selectedCycle})</p>
        <p><em>Revisá tu panel de superadmin para aprobar esta solicitud.</em></p>
      `,
    });

    const emailHtml = createConfirmationEmailHtml(ownerName);
    await resend.emails.send({
      from: "contacto@checancha.com",
      to: ownerEmail,
      subject: "¡Hemos recibido tu solicitud en CheCancha!",
      html: emailHtml,
    });

    return NextResponse.json(
      { message: "Solicitud enviada con éxito" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[INSCRIPTIONS_POST]", error);
    return new NextResponse("Error al procesar la solicitud", { status: 500 });
  }
}
