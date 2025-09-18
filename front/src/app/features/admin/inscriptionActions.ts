"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import bcrypt from 'bcryptjs';
import { Role } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email";


export async function approveInscription(requestId: string) {
  let inscription; 

  try {
    // 1. Buscamos la solicitud para obtener los datos.
    inscription = await db.inscriptionRequest.findUnique({
      where: { id: requestId, status: "PENDIENTE" },
    });

    if (!inscription) {
      throw new Error("Solicitud no encontrada o ya ha sido procesada.");
    }

    // 2. Preparamos los datos (como la contraseña hasheada) fuera de la transacción.
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    
    // 3. Ejecutamos las operaciones críticas de la base de datos en una transacción.
    const newUser = await db.$transaction(async (prisma) => {
      // a. Actualizamos el estado de la solicitud.
      await prisma.inscriptionRequest.update({
        where: { id: requestId },
        data: { status: "APROBADO" },
      });

      // b. Creamos el nuevo usuario con el rol MANAGER.
      const createdUser = await prisma.user.create({
        data: {
          name: inscription!.ownerName,
          email: inscription!.ownerEmail,
          phone: inscription!.ownerPhone,
          hashedPassword: hashedPassword,
          role: Role.MANAGER,
        },
      });

      // c. Creamos el complejo con los datos básicos de la inscripción.
      // Los campos como slotDurationMinutes, openHour, etc., son opcionales y se llenarán después.
      await prisma.complex.create({
        data: {
          name: inscription!.complexName,
          address: inscription!.address,
          city: inscription!.city,
          province: inscription!.province,
          managerId: createdUser.id,
        },
      });

      return createdUser;
    });
    
    // 4. DESPUÉS de que la transacción fue exitosa, intentamos enviar el email.
    try {
      await sendWelcomeEmail(newUser.email!, newUser.name!, temporaryPassword);
    } catch (emailError) {
      console.error("La transacción de la BBDD fue exitosa, pero falló el envío del email:", emailError);
      revalidatePath("/admin"); 
      return { 
        success: true, 
        warning: `El complejo '${inscription.complexName}' fue aprobado, PERO el email de bienvenida no se pudo enviar. La contraseña temporal es: ${temporaryPassword}` 
      };
    }
    
    revalidatePath("/admin"); 
    return { success: true, message: `Complejo '${inscription.complexName}' aprobado y email de bienvenida enviado.` };

  } catch (error) {
    console.error("Error al aprobar la inscripción:", error);
    return { success: false, error: "No se pudo aprobar la solicitud." };
  }
}

/**
 * Rechaza una solicitud de inscripción.
 */
export async function rejectInscription(requestId: string) {
    try {
        await db.inscriptionRequest.update({
            where: { id: requestId },
            data: { status: "RECHAZADO" },
        });

        // TODO: Enviar un email notificando el rechazo si se desea.

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error al rechazar la inscripción:", error);
        return { success: false, error: "No se pudo rechazar la solicitud." };
    }
}

