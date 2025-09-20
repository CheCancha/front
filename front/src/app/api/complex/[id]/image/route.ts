import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/shared/lib/db";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ====================== DELETE ======================
export async function DELETE(
  req: Request,
  context: { params: Promise <{ id: string; imageId: string }> }
) {
  try {
    const { id: complexId, imageId } = await context.params;

    // 1. Autenticación y Autorización
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Verificar que la imagen pertenece al complejo del manager
    const image = await db.image.findFirst({
      where: { id: imageId, complexId },
      include: { complex: true },
    });

    if (!image || image.complex.managerId !== session.user.id) {
      return new NextResponse("Recurso no encontrado o no autorizado", {
        status: 404,
      });
    }

    // 3. Eliminar el archivo de Supabase Storage
    if (image.path) {
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove([image.path]);
      if (storageError) {
        console.error("Error al eliminar de Supabase:", storageError);
      }
    }

    // 4. Eliminar el registro en la base de datos
    await db.image.delete({ where: { id: imageId } });

    // 5. Si la imagen eliminada era la principal, reasignar a otra si existe
    if (image.isPrimary) {
      const anotherImage = await db.image.findFirst({
        where: { complexId },
      });
      if (anotherImage) {
        await db.image.update({
          where: { id: anotherImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return new NextResponse("Imagen eliminada exitosamente", { status: 200 });
  } catch (error) {
    console.error("[IMAGE_DELETE]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

