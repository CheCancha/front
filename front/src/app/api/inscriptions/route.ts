import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializamos Resend con tu API key (guardada en .env)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerName, ownerEmail, complexName, /* ...otros datos */ } = body;

    // Aquí podrías guardar la solicitud en tu base de datos primero
    // await db.application.create({ data: body });

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'ignacionweppler@gmail.com',
      subject: `Nueva solicitud de registro: ${complexName}`,
      html: `
        <h1>Nueva Solicitud de Complejo</h1>
        <p><strong>Nombre del Complejo:</strong> ${complexName}</p>
        <p><strong>Nombre del Dueño:</strong> ${ownerName}</p>
        <p><strong>Email:</strong> ${ownerEmail}</p>
        <p><em>Revisá tu panel de superadmin para aprobar esta solicitud.</em></p>
      `,
    });

    return NextResponse.json({ message: 'Solicitud enviada con éxito' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error al enviar la solicitud', { status: 500 });
  }
}
