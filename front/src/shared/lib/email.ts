import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Para el modo de prueba, SIEMPRE usaremos este remitente.
const fromEmail = 'onboarding@resend.dev';

const loginUrl = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/login`
  : 'http://localhost:3000/login';

/**
 * Envía un email de bienvenida al nuevo manager con sus credenciales temporales.
 */
export const sendWelcomeEmail = async (
  managerEmail: string,
  managerName: string,
  temporaryPassword: string
) => {
  try {
    // --- LÓGICA DE MODO DE PRUEBA ---
    // Verificamos si estamos en desarrollo y si hay un email de prueba configurado.
    const isDevelopment = process.env.NODE_ENV === 'development';
    const testRecipient = process.env.RESEND_TEST_RECIPIENT_EMAIL;

    // Si estamos en desarrollo, el destinatario ('to') será tu email.
    // Si estamos en producción, será el email real del manager.
    const recipientEmail = isDevelopment && testRecipient ? testRecipient : managerEmail;

    console.log(`Enviando email. Destinatario original: ${managerEmail}, Destinatario real: ${recipientEmail}`);

    const emailHtml = `
      <div>
        <h1>¡Bienvenido a CheCancha, ${managerName}!</h1>
        <p>
          Tu solicitud para el complejo ha sido aprobada. Ya podés empezar a gestionar tus canchas y reservas.
        </p>
        <p>Estos son tus datos de acceso temporales:</p>
        <ul>
          <li><strong>Email:</strong> ${managerEmail}</li>
          <li><strong>Contraseña:</strong> <strong style="font-size: 16px; color: #D32F2F;">${temporaryPassword}</strong></li>
        </ul>
        <p>
          Por favor, iniciá sesión y cambiá tu contraseña desde tu perfil lo antes posible.
        </p>
        <a 
          href="${loginUrl}" 
          style="display: inline-block; padding: 12px 24px; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;"
        >
          Iniciar Sesión en CheCancha
        </a>
        <br />
        <p style="margin-top: 20px;">¡Gracias por unirte a nuestra comunidad!</p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail, // Usamos la variable del destinatario
      subject: `[PRUEBA] ¡Tu complejo ha sido aprobado en CheCancha!`, // Añadimos [PRUEBA] para no confundirnos
      html: emailHtml,
    });

    console.log(`Solicitud de email enviada a Resend para: ${recipientEmail}`);
  } catch (error) {
    console.error("Error al enviar el email de bienvenida:", error);
    throw new Error("No se pudo enviar el email de bienvenida.");
  }
};
