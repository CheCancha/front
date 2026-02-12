"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import bcrypt from "bcryptjs";
import { InscriptionRequest, Role, SubscriptionPlan, SubscriptionCycle } from "@prisma/client";
import { sendWelcomeEmail } from "@/shared/lib/email";
import { slugify } from "@/shared/lib/utils";
import { add } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";
import { normalizePhoneNumber } from "@/shared/lib/utils";

// --- VALIDACIÓN DE SESIÓN DE ADMIN ---
const ensureAdmin = async () => {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Acceso no autorizado.");
    }
    return session;
};

export async function getPendingInscriptionRequestsForAdmin(): Promise<InscriptionRequest[]> {
  await ensureAdmin();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Acceso no autorizado.");
  }

  const requests = await db.inscriptionRequest.findMany({
    where: { status: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
  });
  return requests;
}

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
  await ensureAdmin();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Acceso no autorizado." };
  }

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
    
    const normalizedComplexName = inscription.complexName.trim().toLowerCase();
    
    const baseSlug = slugify(inscription.complexName);
    const existingComplexSlug = await db.complex.findUnique({
        where: { slug: baseSlug }
    });
    
    if (existingComplexSlug) {
         return {
            success: false,
            error: `Ya existe un complejo con la URL generada: ${baseSlug}. Modifica el nombre del complejo.`,
        };
    }

    const existingComplexByName = await db.complex.findFirst({
        where: { 
            name: {
                equals: normalizedComplexName,
                mode: 'insensitive'
            }
        },
    });

    if (existingComplexByName) {
        return {
            success: false,
            error: `Ya existe un complejo con un nombre similar a "${inscription.complexName}".`,
        };
    }

    const plan = getPlanEnumFromString(inscription.selectedPlan);
    const trialEndsAt = add(new Date(), { days: 90 });

    // --- CORRECCIÓN DE USUARIOS (NORMALIZACIÓN Y BÚSQUEDA DUAL) ---
    
    const normalizedPhone = normalizePhoneNumber(inscription.ownerPhone);
    const lowerEmail = inscription.ownerEmail.toLowerCase();

    // Buscamos usuario por Email O Teléfono
    let user = await db.user.findFirst({
      where: {
        OR: [
            { email: lowerEmail },
            { phone: normalizedPhone }
        ]
      },
    });

    // Validación de conflictos
    if (user) {
        // Conflicto A: El teléfono ya existe en otro email
        if (user.phone === normalizedPhone && user.email !== lowerEmail) {
            return { 
                success: false, 
                error: `El teléfono ${normalizedPhone} ya está registrado en la cuenta: ${user.email}.` 
            };
        }

        // Conflicto B: El email ya existe con otro teléfono
        if (user.email === lowerEmail && user.phone !== normalizedPhone) {
            return {
                success: false,
                error: `El email ${lowerEmail} ya existe, pero tiene el teléfono ${user.phone} asociado. Verifica los datos.`
            };
        }
        
        // Si coincide todo (o no hay conflicto bloqueante), usamos este usuario.
    }

    let isNewUser = false;
    let temporaryPassword: string | null = null;

    // Si NO existe, lo creamos
    if (!user) {
      isNewUser = true;
      temporaryPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      user = await db.user.create({
        data: {
          name: inscription.ownerName,
          email: lowerEmail, // Usar minusculas
          phone: normalizedPhone, // Usar normalizado
          hashedPassword,
          role: Role.MANAGER,
        },
      });
    }

    const existingComplexForManager = await db.complex.findUnique({
      where: { managerId: user.id },
    });

    if (existingComplexForManager) {
      return {
        success: false,
        error: `El usuario ${lowerEmail} ya tiene asignado el complejo "${existingComplexForManager.name}".`,
      };
    }

    await db.complex.create({
      data: {
        name: inscription.complexName.trim(),
        slug: baseSlug, // Usamos el slug base validado
        address: inscription.address,
        city: inscription.city,
        province: inscription.province,
        managerId: user.id,
        inscriptionRequestId: inscription.id,
        subscriptionPlan: plan,
        subscriptionCycle: inscription.selectedCycle as SubscriptionCycle,
        trialEndsAt: trialEndsAt,
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
  } catch (error: unknown) {
    console.error("Error al aprobar la inscripción:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo aprobar la solicitud. Revisa la consola del servidor.",
    };
  }
}

export async function rejectInscription(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Acceso no autorizado." };
  }

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

export async function updateInscription(
  requestId: string,
  dataToUpdate: Partial<Omit<InscriptionRequest, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Acceso no autorizado." };
  }

  try {
    await db.inscriptionRequest.update({
      where: { id: requestId },
      data: dataToUpdate,
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la solicitud:", error);
    return { success: false, error: "No se pudo actualizar la solicitud." };
  }
};


export async function resendWelcomeEmail(managerId: string): Promise<{ success: boolean; error?: string }> {
    await ensureAdmin();
    try {
        const user = await db.user.findUnique({ where: { id: managerId } });

        if (!user || user.role !== 'MANAGER') {
            return { success: false, error: "Manager no encontrado." };
        }

        const temporaryPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

        await db.user.update({
            where: { id: managerId },
            data: { hashedPassword },
        });

        await sendWelcomeEmail(user.email!, user.name!, user.phone!, temporaryPassword);

        return { success: true };

    } catch (error) {
        console.error("Error al reenviar el email de bienvenida:", error);
        return { success: false, error: "No se pudo reenviar el email. Revisa la consola del servidor." };
    }
}

export async function updateManager(
    managerId: string,
    data: { name: string; email: string; phone: string }
): Promise<{ success: boolean; error?: string }> {
    await ensureAdmin();
    try {
        const existingUserWithEmail = await db.user.findFirst({
            where: {
                email: data.email,
                id: { not: managerId },
            },
        });

        if (existingUserWithEmail) {
            return { success: false, error: "El email ya está en uso por otro usuario." };
        }

        await db.user.update({
            where: { id: managerId },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
            },
        });

        revalidatePath("/admin"); 
        return { success: true };

    } catch (error) {
        console.error("Error al actualizar el manager:", error);
        return { success: false, error: "No se pudo actualizar el manager." };
    }
}