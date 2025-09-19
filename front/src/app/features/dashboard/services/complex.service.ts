"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { routes } from "@/routes";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validate } from "uuid";

// Esquemas de validación
const createComplexSchema = z
  .object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    address: z.string().min(5, "La dirección es muy corta."),
    city: z.string().min(3, "El nombre de la ciudad es muy corto."),
    province: z.string().min(3, "El nombre de la provincia es muy corto."),
    subscriptionPlan: z.enum(["BASE", "ESTANDAR", "FULL", "FREE"]).optional(),
    slotDurationMinutes: z
      .number()
      .min(60, "La duración mínima es de 60 minutos."),
    openHour: z
      .number()
      .min(0, "La hora debe ser entre 0 y 23")
      .max(23, "La hora debe ser entre 0 y 23"),
    closeHour: z
      .number()
      .min(1, "La hora debe ser entre 1 y 23")
      .max(23, "La hora debe ser entre 1 y 23"),
  })
  .refine((data) => data.closeHour > data.openHour, {
    message: "La hora de cierre debe ser posterior a la hora de apertura",
    path: ["closeHour"],
  });

const imageValidationSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024, "La imagen no puede superar los 5MB"),
  type: z
    .string()
    .refine(
      (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
      "Solo se permiten archivos JPG, PNG y WebP"
    ),
});

// Tipos
type CreateComplexData = z.infer<typeof createComplexSchema>;
type ImageFile = z.infer<typeof imageValidationSchema>;

// Constantes
const MAX_IMAGES = 5;
const SUPABASE_BUCKET = "complex-images";

// Utilidades
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );
}

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

function parseFormDataToComplexData(formData: FormData): CreateComplexData {
  const rawData = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    province: formData.get("province") as string,
    slotDurationMinutes: parseInt(
      formData.get("slotDurationMinutes") as string,
      10
    ),
    openHour: parseInt(formData.get("openHour") as string, 10),
    closeHour: parseInt(formData.get("closeHour") as string, 10),
  };

  return createComplexSchema.parse(rawData);
}

function extractAndValidateImages(formData: FormData): File[] {
  const images = formData
    .getAll("images")
    .filter((f) => f instanceof File && f.size > 0) as File[];

  if (images.length > MAX_IMAGES) {
    throw new Error(`Solo se permiten hasta ${MAX_IMAGES} imágenes`);
  }

  // Validar cada imagen
  images.forEach((image) => {
    imageValidationSchema.parse({
      name: image.name,
      size: image.size,
      type: image.type,
    });
  });

  return images;
}

async function uploadImagesToSupabase(
  images: File[]
): Promise<{ url: string; path: string }[]> {
  if (images.length === 0) return [];

  const supabase = await createSupabaseClient();

  const uploadPromises = images.map(async (image) => {
    const fileName = generateUniqueFileName(image.name);

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error(`Error subiendo imagen ${image.name}:`, error);
      throw new Error(`No se pudo subir la imagen: ${image.name}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
  });

  return Promise.all(uploadPromises);
}

async function validateUserPermissions(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  if (session.user.role !== "MANAGER") {
    throw new Error("No tienes permisos para crear complejos");
  }

  return session.user.id;
}

// Funciones principales
export async function createComplex(formData: FormData) {
  try {
    // Validar permisos de usuario
    const managerId = await validateUserPermissions();

    // Parsear y validar datos del formulario
    const validatedData = parseFormDataToComplexData(formData);

    // Extraer y validar imágenes
    const images = extractAndValidateImages(formData);

    // Subir imágenes a Supabase
    const imageUrls = await uploadImagesToSupabase(images);

    const uploadedImages = await uploadImagesToSupabase(images);

    // Crear complejo en la base de datos
    const newComplex = await db.complex.create({
      data: {
        name: validatedData.name,
        address: validatedData.address,
        city: validatedData.city,
        province: validatedData.province,
        openHour: validatedData.openHour,
        closeHour: validatedData.closeHour,
        courtCount: 0,
        slotDurationMinutes: validatedData.slotDurationMinutes,
        managerId,
        subscriptionPlan: validatedData.subscriptionPlan || "FREE",
        images: {
          create: uploadedImages.map((img, index) => ({
            url: img.url,
            path: img.path,
            isPrimary: index === 0,
          })),
        },
      },
    });

    // Revalidar cache y redirigir
    revalidatePath("/dashboard");
    redirect(routes.app.dashboard(newComplex.id));
  } catch (error) {
    console.error("Error en createComplex:", error);

    // Manejo específico de errores
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]; // Cambié 'errors' por 'issues'
      return {
        error: firstError?.message || "Datos del formulario inválidos",
      };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }

    return {
      error: "Ocurrió un error inesperado al crear el complejo",
    };
  }
}

// Función auxiliar para limpiar imágenes huérfanas (opcional)
export async function cleanupOrphanedImages(imageUrls: string[]) {
  try {
    const supabase = await createSupabaseClient();
    const deletePromises = imageUrls.map(async (url) => {
      const fileName = url.split("/").pop();
      if (fileName) {
        await supabase.storage.from(SUPABASE_BUCKET).remove([fileName]);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error limpiando imágenes:", error);
    // No lanzamos el error porque es una operación de limpieza
  }
}
