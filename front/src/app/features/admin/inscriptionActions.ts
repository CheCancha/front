"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import bcrypt from 'bcryptjs';
import { Role, SubscriptionPlan } from "@prisma/client";
import { sendWelcomeEmail } from "@/shared/lib/email";

const getPlanEnumFromString = (planString: string): SubscriptionPlan => {
  switch (planString) {
    case "Plan Básico":
      return SubscriptionPlan.BASE;
    case "Plan Estándar":
      return SubscriptionPlan.ESTANDAR;
    case "Plan Full":
      return SubscriptionPlan.FULL;
    default:
      return SubscriptionPlan.FREE;
  }
};


export async function approveInscription(requestId: string): Promise<{ success: boolean; message?: string; error?: string; warning?: string }> {
  let inscription; 

  try {
    inscription = await db.inscriptionRequest.findUnique({
      where: { id: requestId, status: "PENDIENTE" },
    });

    if (!inscription) {
      return { success: false, error: "Solicitud no encontrada o ya ha sido procesada." };
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    
    const plan = getPlanEnumFromString(inscription.selectedPlan);
    
    const newUser = await db.$transaction(async (prisma) => {
      await prisma.inscriptionRequest.update({
        where: { id: requestId },
        data: { status: "APROBADO" },
      });

      const createdUser = await prisma.user.create({
        data: {
          name: inscription!.ownerName,
          email: inscription!.ownerEmail,
          phone: inscription!.ownerPhone,
          hashedPassword: hashedPassword,
          role: Role.MANAGER,
        },
      });

      await prisma.complex.create({
        data: {
          name: inscription!.complexName,
          slug: inscription!.complexSlug,
          address: inscription!.address,
          city: inscription!.city,
          province: inscription!.province,
          managerId: createdUser.id,
          subscriptionPlan: plan,
        },
      });

      return createdUser;
    }, { timeout: 15000 });
    
    try {
      await sendWelcomeEmail(newUser.email!, newUser.name!, newUser.phone!, temporaryPassword);
    } catch (emailError) {
      console.error("La transacción de la BBDD fue exitosa, pero falló el envío del email:", emailError);
      revalidatePath("/admin");
      return { 
        success: true, 
        warning: `El complejo fue aprobado, PERO el email de bienvenida no se pudo enviar. Contraseña temporal: ${temporaryPassword}` 
      };
    }
    
    revalidatePath("/admin"); 
    return { success: true, message: `Complejo '${inscription.complexName}' aprobado y email enviado.` };

  } catch (error) {
    console.error("Error al aprobar la inscripción:", error);
    return { success: false, error: "No se pudo aprobar la solicitud. Revisa la consola del servidor." };
  }
}

export async function rejectInscription(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.inscriptionRequest.update({
            where: { id: requestId, status: "PENDIENTE" },
            data: { status: "RECHAZADO" },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error al rechazar la inscripción:", error);
        return { success: false, error: "No se pudo rechazar la solicitud." };
    }
}

