'use server';

import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { InscriptionRequest } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/shared/lib/email";
import { normalizePhoneNumber } from "@/shared/lib/utils";

const createSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

export const getPendingInscriptionRequestsForAdmin = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    throw new Error("Acceso no autorizado.");
  }
  const requests = await db.inscriptionRequest.findMany({
    where: { status: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
  });
  return requests;
};

const generateTemporaryPassword = (length = 10) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const approveInscription = async (
  requestId: string,
  updatedData: Partial<InscriptionRequest>
) => {
  try {
    const inscriptionRequest = await db.inscriptionRequest.findUnique({
      where: { id: requestId },
    });

    if (!inscriptionRequest || inscriptionRequest.status !== 'PENDIENTE') {
      return { success: false, error: "Solicitud no encontrada o ya procesada." };
    }
    
    const finalData = { ...inscriptionRequest, ...updatedData };
    const normalizedPhone = normalizePhoneNumber(finalData.ownerPhone);

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: finalData.ownerEmail }, { phone: normalizedPhone }],
      },
    });

    if (existingUser) {
      return { success: false, error: "Ya existe un usuario con este email o teléfono." };
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await db.$transaction(async (prisma) => {
      // 1. Creamos el nuevo usuario (manager).
      const newUser = await prisma.user.create({
        data: {
          name: finalData.ownerName,
          email: finalData.ownerEmail,
          phone: normalizedPhone,
          hashedPassword: hashedPassword, 
          role: 'MANAGER',
        },
      });

      // 2. Creamos el nuevo complejo.
      await prisma.complex.create({
        data: {
          name: finalData.complexName,
          slug: createSlug(finalData.complexName),
          address: finalData.address,
          city: finalData.city,
          province: finalData.province,
          managerId: newUser.id,
        },
      });

      // 3. Actualizamos la solicitud original.
      await prisma.inscriptionRequest.update({
        where: { id: requestId },
        data: { 
            status: 'APROBADO',
            ...updatedData
        },
      });
    });
    
    try {
      await sendWelcomeEmail(
        finalData.ownerEmail,
        normalizedPhone,
        finalData.ownerName,
        temporaryPassword
      );
    } catch (emailError) {
      console.error("Base de datos actualizada, pero falló el envío del email:", emailError);
      return { success: true, warning: "El usuario y complejo fueron creados, pero falló el envío del email. Contactá al usuario manualmente." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al aprobar la solicitud:", error);
    return { success: false, error: "Ocurrió un error en el servidor al aprobar la solicitud." };
  }
};

export const rejectInscription = async (requestId: string) => {
  try {
    await db.inscriptionRequest.update({
      where: {
        id: requestId,
        status: 'PENDIENTE',
      },
      data: {
        status: 'RECHAZADO',
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error al rechazar la solicitud:", error);
    return { success: false, error: "No se pudo rechazar la solicitud." };
  }
};

