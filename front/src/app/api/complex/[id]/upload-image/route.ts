import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/shared/lib/db";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

//  UPLOAD 
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Autenticación y Autorización
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const complex = await db.complex.findFirst({
      where: { id: id, managerId: session.user.id },
    });
    if (!complex) {
      return new NextResponse("Complejo no encontrado o no autorizado", {
        status: 404,
      });
    }

    // 2. Procesar el archivo de la solicitud
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new NextResponse("No se proporcionó ningún archivo", { status: 400 });
    }

    // 3. Subir el archivo a Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `complex-images/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("Images")
      .upload(filePath, buffer, { contentType: file.type });

    if (uploadError) {
      console.error("Error al subir a Supabase:", uploadError);
      return new NextResponse("Error al subir la imagen", { status: 500 });
    }

    // 4. Obtener la URL pública
    const { data: urlData } = supabase.storage
      .from("Images")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return new NextResponse("No se pudo obtener la URL de la imagen", { status: 500 });
    }

    // 5. Guardar en la DB
    const isFirst = (await db.image.count({ where: { id } })) === 0;
    const newImage = await db.image.create({
      data: {
        complexId: id,
        url: urlData.publicUrl,
        path: filePath,
        isPrimary: isFirst,
      },
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error("[IMAGE_UPLOAD_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

