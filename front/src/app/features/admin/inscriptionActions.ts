"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import bcrypt from "bcryptjs";
import { Role, SubscriptionPlan, SubscriptionCycle } from "@prisma/client"; // <- Importar SubscriptionCycle
import { sendWelcomeEmail } from "@/shared/lib/email";
import { slugify } from "@/shared/lib/utils";
import { add } from "date-fns"; // <- Importar 'add' para calcular la fecha

const getPlanEnumFromString = (planString: string): SubscriptionPlan => {
  switch (planString) {
    case "Plan Básico":
      return SubscriptionPlan.BASE;
    case "Plan Pro":
      return SubscriptionPlan.FULL;
    default:
      return SubscriptionPlan.FREE;
  }
};

export async function approveInscription(
  requestId: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
}> {
  try {
    const inscription = await db.inscriptionRequest.findUnique({
      where: { id: requestId, status: "PENDIENTE" },
    });

    if (!inscription) {
      return {
        success: false,
        error: "Solicitud no encontrada o ya procesada.",
      };
    }

    const plan = getPlanEnumFromString(inscription.selectedPlan);
    const trialEndsAt = add(new Date(), { days: 90 }); // Calcular fecha de fin de prueba

    let user = await db.user.findUnique({
      where: { email: inscription.ownerEmail },
    });

    let isNewUser = false;
    let temporaryPassword: string | null = null;

    if (!user) {
      isNewUser = true;
      temporaryPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      user = await db.user.create({
        data: {
          name: inscription.ownerName,
          email: inscription.ownerEmail,
          phone: inscription.ownerPhone,
          hashedPassword,
          role: Role.MANAGER,
        },
      });
    }

    const existingComplex = await db.complex.findUnique({
      where: { managerId: user.id },
    });

    if (existingComplex) {
      return {
        success: false,
        error: `El usuario ${inscription.ownerEmail} ya tiene asignado el complejo "${existingComplex.name}".`,
      };
    }

    // --- CORRECCIÓN CLAVE AQUÍ ---
    // Añadimos los campos que faltaban al crear el complejo
    await db.complex.create({
      data: {
        name: inscription.complexName,
        slug: slugify(inscription.complexName),
        address: inscription.address,
        city: inscription.city,
        province: inscription.province,
        managerId: user.id,
        inscriptionRequestId: inscription.id, // Conectar con la solicitud
        subscriptionPlan: plan,
        subscriptionCycle: inscription.selectedCycle as SubscriptionCycle, // <- Guardar el ciclo
        trialEndsAt: trialEndsAt, // <- Guardar la fecha de fin de prueba
      },
    });

    await db.inscriptionRequest.update({
      where: { id: requestId },
      data: { status: "APROBADO" },
    });

    if (isNewUser && temporaryPassword) {
      try {
        await sendWelcomeEmail(
          user.email!,
          user.name!,
          user.phone!,
          temporaryPassword
        );
      } catch (emailError) {
        console.error("Falló el envío de email:", emailError);
        revalidatePath("/admin");
        return {
          success: true,
          warning: `El complejo fue aprobado, PERO el email no se pudo enviar. Contraseña temporal: ${temporaryPassword}`,
        };
      }
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: `Complejo '${inscription.complexName}' aprobado correctamente.`,
    };
  } catch (error) {
    console.error("Error al aprobar la inscripción:", error);
    return {
      success: false,
      error: "No se pudo aprobar la solicitud. Revisa la consola del servidor.",
    };
  }
}

export async function rejectInscription(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
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