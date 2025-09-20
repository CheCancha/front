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
      return new NextResponse("Datos inválidos", { status: 400 });
    }

    // 1. Guardamos la solicitud en la base de datos usando Prisma
    await db.inscriptionRequest.create({
      data: {
        ownerName: body.ownerName,
        ownerEmail: body.ownerEmail,
        ownerPhone: normalizePhoneNumber(body.ownerPhone),
        complexName: body.complexName,
        address: body.address,
        city: body.city,
        province: body.province,
        sports: body.sports,
        selectedPlan: body.selectedPlan,
        status: "PENDIENTE",
      },
    });

    // 2. Si se guardó correctamente, enviamos el email de notificación
    await resend.emails.send({
      from: "onboarding@resend.dev", // Cambiar por un email verificado en Resend
      to: "ignacionweppler@gmail.com",
      subject: `Nueva solicitud de registro: ${body.complexName}`,
      html: `
        <h1>Nueva Solicitud de Complejo</h1>
        <p><strong>Nombre del Complejo:</strong> ${body.complexName}</p>
        <p><strong>Nombre del Dueño:</strong> ${body.ownerName}</p>
        <p><strong>Email:</strong> ${body.ownerEmail}</p>
        <p><strong>Teléfono:</strong> ${body.ownerPhone}</p>
        <p><strong>Plan Seleccionado:</strong> ${body.selectedPlan}</p>
        <p><em>Revisá tu panel de superadmin para aprobar esta solicitud.</em></p>
      `,
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
