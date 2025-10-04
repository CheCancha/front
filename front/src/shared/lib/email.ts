import { Resend } from "resend";
import { Booking, User, Court, Complex } from '@prisma/client';

// Importamos TODAS las plantillas de email
import BookingCancelledByPlayerEmail from '@/shared/components/emails/CancelledByPlayer';
import BookingCancelledByManagerEmail from '@/shared/components/emails/CancelledByManager';
import WelcomeEmail from "@/shared/components/emails/WelcomeEmail";
import PasswordResetEmail from "@/shared/components/emails/PasswordResetEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- Constantes y Tipos Comunes ---
const fromEmail = "CheCancha <contacto@checancha.com>";
const baseURL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const logoUrl = `${baseURL}/logochecancha.png`;

type BookingWithDetailsForEmail = Booking & {
  user: User | null;
  court: Court & {
    complex: Complex & {
      manager: User;
    };
  };
};

// --- Función de Bienvenida ---
export const sendWelcomeEmail = async (
  managerEmail: string,
  managerPhone: string,
  managerName: string,
  temporaryPassword: string
) => {
  try {
    const testRecipient = process.env.RESEND_RECIPIENT_EMAIL;
    const recipientEmail = process.env.NODE_ENV === "production" ? managerEmail : testRecipient;

    if (!recipientEmail) {
      console.error("Modo de prueba: RESEND_RECIPIENT_EMAIL no está configurado.");
      throw new Error("El email de prueba no está configurado.");
    }

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `¡Felicitaciones! Tu complejo ha sido aprobado en CheCancha`,
      react: WelcomeEmail({
        managerName,
        managerPhone,
        temporaryPassword,
        loginUrl: `${baseURL}/login`,
        logoUrl,
      }),
    });

    console.log(`Email de bienvenida enviado a: ${recipientEmail}`);
  } catch (error) {
    console.error("Error al enviar el email de bienvenida:", error);
    throw new Error("No se pudo enviar el email de bienvenida.");
  }
};

// --- Función de Reseteo de Contraseña  ---
export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    const recipientEmail = process.env.RESEND_RECIPIENT_EMAIL || email;
    const resetUrl = `${baseURL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "Restablecé tu contraseña de CheCancha",
      react: PasswordResetEmail({ resetUrl }),
    });

    console.log(`Email de reseteo de contraseña enviado a: ${recipientEmail}`);
  } catch (error) {
    console.error("Error al enviar el email de reseteo:", error);
    throw new Error("No se pudo enviar el email de reseteo.");
  }
};



export async function sendBookingCancelledByPlayerEmail(booking: BookingWithDetailsForEmail) {
  if (!booking.user || !booking.court.complex.manager.email) {
    console.warn("Faltan datos de usuario o manager para enviar el email de cancelación.");
    return;
  }

  const subject = `Un jugador ha cancelado una reserva - CheCancha`;
  const to = booking.court.complex.manager.email;

  try {
    await resend.emails.send({
      from: 'CheCancha <no-reply@checancha.com>',
      to: to,
      subject: subject,
      react: BookingCancelledByPlayerEmail({ booking }),
    });
    console.log(`Email de cancelación (por jugador) enviado a ${to}`);
  } catch (error) {
    console.error("Error al enviar el email de cancelación al manager:", error);
  }
}


export async function sendBookingCancelledByManagerEmail(booking: BookingWithDetailsForEmail) {
  if (!booking.user?.email) {
    console.warn("El usuario de la reserva no tiene un email para notificar la cancelación.");
    return;
  }

  const subject = `Tu reserva en ${booking.court.complex.name} ha sido cancelada`;
  const to = booking.user.email;

  try {
    await resend.emails.send({
      from: 'CheCancha <no-reply@checancha.com>',
      to: to,
      subject: subject,
      react: BookingCancelledByManagerEmail({ booking }),
    });
    console.log(`Email de cancelación (por manager) enviado a ${to}`);
  } catch (error) {
    console.error("Error al enviar el email de cancelación al jugador:", error);
  }
}
