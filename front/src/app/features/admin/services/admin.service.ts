"use server";

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
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

export const getPendingInscriptionRequestsForAdmin = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Acceso no autorizado.");
  }
  const requests = await db.inscriptionRequest.findMany({
    where: { status: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
  });
  return requests;
};

const generateTemporaryPassword = (length = 10) => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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

    if (!inscriptionRequest || inscriptionRequest.status !== "PENDIENTE") {
      return {
        success: false,
        error: "Solicitud no encontrada o ya procesada.",
      };
    }

    const finalData = { ...inscriptionRequest, ...updatedData };
    const normalizedPhone = normalizePhoneNumber(finalData.ownerPhone);

    // 🔹 1. Buscamos si ya existe el usuario
    let user = await db.user.findFirst({
      where: {
        OR: [{ email: finalData.ownerEmail }, { phone: normalizedPhone }],
      },
    });

    // 🔹 2. Si no existe, lo creamos
    let temporaryPassword: string | null = null;
    if (!user) {
      temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      user = await db.user.create({
        data: {
          name: finalData.ownerName,
          email: finalData.ownerEmail,
          phone: normalizedPhone,
          hashedPassword,
          role: "MANAGER",
        },
      });
    }

    // 🔹 3. Revisamos si ya tiene complejo asignado
    const existingComplex = await db.complex.findFirst({
      where: { managerId: user.id },
    });

    if (existingComplex) {
      return {
        success: false,
        error: `El usuario ${user.email} ya tiene asignado el complejo "${existingComplex.name}".`,
      };
    }

    // 🔹 4. Revisamos si ya existe un complejo con ese nombre (evita duplicados)
    const duplicateComplexName = await db.complex.findFirst({
      where: { name: finalData.complexName },
    });

    if (duplicateComplexName) {
      return {
        success: false,
        error: `Ya existe un complejo llamado "${duplicateComplexName.name}".`,
      };
    }

    // 🔹 5. Creamos el complejo
    await db.complex.create({
      data: {
        name: finalData.complexName,
        slug: createSlug(finalData.complexName),
        address: finalData.address,
        city: finalData.city,
        province: finalData.province,
        managerId: user.id,
      },
    });

    // 🔹 6. Actualizamos el estado de la solicitud
    await db.inscriptionRequest.update({
      where: { id: requestId },
      data: { status: "APROBADO", ...updatedData },
    });

    // 🔹 7. Enviamos el mail solo si el usuario fue recién creado
    if (temporaryPassword) {
      try {
        await sendWelcomeEmail(
          finalData.ownerEmail,
          normalizedPhone,
          finalData.ownerName,
          temporaryPassword
        );
      } catch (emailError) {
        console.error("Fallo el envío del email de bienvenida:", emailError);
        return {
          success: true,
          warning:
            "El usuario y complejo fueron creados, pero falló el envío del email. Contactá al usuario manualmente.",
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error al aprobar la solicitud:", error);
    return {
      success: false,
      error: "Error del servidor al aprobar la solicitud.",
    };
  }
};

export const rejectInscription = async (requestId: string) => {
  try {
    await db.inscriptionRequest.update({
      where: {
        id: requestId,
        status: "PENDIENTE",
      },
      data: {
        status: "RECHAZADO",
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error al rechazar la solicitud:", error);
    return { success: false, error: "No se pudo rechazar la solicitud." };
  }
};
