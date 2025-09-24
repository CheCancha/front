import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = "CheCancha <onboarding@resend.dev>";

const loginUrl = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/login`
  : "http://localhost:3000/login";

export const sendWelcomeEmail = async (
  managerEmail: string,
  managerPhone: string,
  managerName: string,
  temporaryPassword: string
) => {
  try {
    const testRecipient = process.env.RESEND_TEST_RECIPIENT_EMAIL;

    const recipientEmail = testRecipient;

    if (!recipientEmail) {
      console.error(
        "Modo de prueba: RESEND_TEST_RECIPIENT_EMAIL no está configurado en .env. No se puede enviar el email."
      );
      throw new Error("El email de prueba no está configurado en el servidor.");
    }

    console.log(
      `Enviando email de bienvenida. Destinatario original: ${managerEmail}, Destinatario de prueba: ${recipientEmail}`
    );

    // --- PLANTILLA DE EMAIL ---
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h1 style="font-size: 24px; color: #1a1a1a;">¡Bienvenido a CheCancha, ${managerName}!</h1>
          <p>
            Tu solicitud para el complejo ha sido aprobada. Ya podés empezar a gestionar tus canchas y reservas.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="font-size: 18px; margin-top: 0;">Tus datos de acceso temporales:</h2>
            <ul style="list-style-type: none; padding: 0;">
              <li><strong>Teléfono (usuario):</strong> ${managerPhone}</li>
              <li><strong>Contraseña Temporal:</strong> <strong style="font-size: 18px; color: #c0392b; background-color: #fff0f0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</strong></li>
            </ul>
          </div>
          <p>
            Por seguridad, te recomendamos iniciar sesión y cambiar tu contraseña desde tu perfil lo antes posible.
          </p>
          <a 
            href="${loginUrl}" 
            style="display: inline-block; padding: 12px 24px; font-size: 16px; color: white; background-color: #e67e22; text-decoration: none; border-radius: 5px; font-weight: bold;"
          >
            Iniciar Sesión
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Si no solicitaste una cuenta, por favor ignora este correo.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `[APROBADO] ¡Felicitaciones! Tu complejo ha sido aprobado en CheCancha`,
      html: emailHtml,
    });

    console.log(
      `Solicitud de email de bienvenida enviada a Resend para: ${recipientEmail}`
    );
  } catch (error) {
    console.error("Error al enviar el email de bienvenida:", error);
    throw new Error("No se pudo enviar el email de bienvenida.");
  }
};

const resetPasswordUrl = (token: string) =>
  process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    : `http://localhost:3000/reset-password?token=${token}`;

export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    const recipientEmail = process.env.RESEND_TEST_RECIPIENT_EMAIL || email;
    const resetUrl = resetPasswordUrl(token);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h1 style="font-size: 24px; color: #1a1a1a;">Solicitud de Reseteo de Contraseña</h1>
          <p>
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón de abajo para elegir una nueva.
          </p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 24px; font-size: 16px; color: white; background-color: #e67e22; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;"
          >
            Resetear Contraseña
          </a>
          <p>
            Si no solicitaste un cambio de contraseña, podés ignorar este correo sin problemas.
          </p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Este enlace es válido por 1 hora.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "Restablecé tu contraseña de CheCancha",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error al enviar el email de reseteo:", error);
    throw new Error("No se pudo enviar el email de reseteo.");
  }
};
