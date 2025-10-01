import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = "CheCancha <contacto@checancha.com>";

const loginUrl = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/login`
  : "http://localhost:3000/login";

const logoUrl = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/logochecancha.png`
  : "http://localhost:3000/logochecancha.png";

export const sendWelcomeEmail = async (
  managerEmail: string,
  managerPhone: string,
  managerName: string,
  temporaryPassword: string
) => {
  try {
    const testRecipient = process.env.RESEND_RECIPIENT_EMAIL;

    const recipientEmail =
      process.env.NODE_ENV === "production" ? managerEmail : testRecipient;


    if (!recipientEmail) {
      console.error(
        "Modo de prueba: RESEND_RECIPIENT_EMAIL no está configurado en .env. No se puede enviar el email."
      );
      throw new Error("El email de prueba no está configurado en el servidor.");
    }

    console.log(
      `Enviando email de bienvenida. Destinatario original: ${managerEmail}, Destinatario de prueba: ${recipientEmail}`
    );

    // --- PLANTILLA DE EMAIL ---
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; }
        .header { background-color: #f97316; padding: 20px; text-align: center; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .credentials-box { background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f97316; }
        .password { font-size: 20px; font-weight: bold; color: #d9534f; background-color: #fdf2f2; padding: 4px 10px; border-radius: 6px; display: inline-block; letter-spacing: 1px; }
        .cta-button { display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; background-color: #f97316; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #888888; padding: 20px; background-color: #fafafa; }
      </style>
    </head>
    <body style="background-color: #f4f4f4; margin: 0; padding: 0;">
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="CheCancha Logo" width="150">
        </div>
        
        <div class="content">
          <h1 style="font-size: 26px; color: #1a1a1a; margin-top: 0;">¡Felicitaciones, ${managerName}!</h1>
          <p>Tu solicitud para unirte a CheCancha ha sido aprobada. ¡Ya podés empezar a gestionar tu complejo y recibir reservas online!</p>
          
          <div class="credentials-box">
            <h2 style="font-size: 18px; margin-top: 0; color: #1a1a1a;">Tus datos para el primer acceso:</h2>
            <p style="margin: 5px 0;"><strong>Teléfono (usuario):</strong> ${managerPhone}</p>
            <p style="margin: 10px 0;"><strong>Contraseña Temporal:</strong> <span class="password">${temporaryPassword}</span></p>
          </div>
          
          <p>Por seguridad, te recomendamos iniciar sesión y cambiar tu contraseña desde tu perfil lo antes posible.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="cta-button">Iniciar Sesión</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Si no solicitaste una cuenta, por favor ignora este correo.</p>
          <p>&copy; ${new Date().getFullYear()} CheCancha. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `¡Felicitaciones! Tu complejo ha sido aprobado en CheCancha`,
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
    const recipientEmail = process.env.RESEND_RECIPIENT_EMAIL || email;
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
