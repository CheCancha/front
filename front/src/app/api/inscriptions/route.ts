import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/shared/lib/db";
import { inscriptionSchema } from "@/shared/lib/inscriptionSchema";
import { normalizePhoneNumber } from "@/shared/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    console.log("Datos validados:", validation.data);

    const result = await db.inscriptionRequest.create({
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

    console.log("Registro creado:", result);

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
        <p><strong>Plan Seleccionado:</strong> ${selectedPlan} (${selectedCycle})</p> <p><em>Revisá tu panel de superadmin para aprobar esta solicitud.</em></p>
      `,
    });

    await resend.emails.send({
      from: "contacto@checancha.com",
      to: body.ownerEmail,
      subject: "¡Hemos recibido tu solicitud en CheCancha!",
      html: `<p>Hola ${body.ownerName}, gracias por registrar tu complejo. Estamos revisando tu solicitud y te avisaremos pronto. ¡Saludos!</p>`,
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
