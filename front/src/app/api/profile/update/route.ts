import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_BUCKET = "profile-images";

// --- Helper para crear el cliente de Supabase en el servidor ---
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

// --- Helper para generar un nombre de archivo único ---
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const phone = formData.get("phone") as string;
    const profileImage = formData.get("profileImage") as File | null;

    const updateData: { phone: string; image?: string } = { phone };

    // 1. Subir la imagen a Supabase si el usuario proporcionó una nueva
    if (profileImage && profileImage.size > 0) {
      const supabase = await createSupabaseClient();
      const fileName = generateUniqueFileName(profileImage.name);

      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(fileName, profileImage, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(`Error al subir la imagen a Supabase: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(data.path);

      updateData.image = publicUrl;
    }

    // 2. Actualizar el usuario en la base de datos
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // 3. Devolver una respuesta exitosa con la URL de la nueva imagen
    return NextResponse.json({
      success: true,
      profileImageUrl: updatedUser.image,
    });
    
  } catch (err) {
    console.error("[PROFILE_UPDATE_ERROR]", err);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil" },
      { status: 500 }
    );
  }
}