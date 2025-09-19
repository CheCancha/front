import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SUPABASE_BUCKET = "profile-images";

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await req.formData();
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string | null;
  const profileImage = formData.get("profileImage") as File | null;

  let profileImageUrl: string | null = null;

  try {
    // Subir imagen a Supabase si existe
    if (profileImage && profileImage.size > 0) {
      const supabase = await createSupabaseClient();
      const fileName = generateUniqueFileName(profileImage.name);

      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(fileName, profileImage, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(data.path);
      profileImageUrl = publicUrl;
    }

    // Preparar datos para actualizar
    const updateData: {
      phone: string;
      password?: string;
      profileImageUrl?: string;
    } = { phone };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;

    // Actualizar usuario
    await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, profileImageUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil" },
      { status: 500 }
    );
  }
}
