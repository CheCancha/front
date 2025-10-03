import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { z } from "zod";
import { authorizeAndVerify } from "@/shared/lib/authorize";

const imagesPayloadSchema = z.object({
  update: z
    .array(
      z.object({
        id: z.string(),
        isPrimary: z.boolean(),
      })
    )
    .optional(),
  delete: z
    .array(
      z.object({
        id: z.string(),
      })
    )
    .optional(),
});


export async function PUT(req: Request, context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;
    const { error } = await authorizeAndVerify(complexId);
    if (error) return error;

    const body = await req.json();
    const validation = imagesPayloadSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const { update, delete: imagesToDelete } = validation.data;

    await db.$transaction(async (prisma) => {
      if (imagesToDelete && imagesToDelete.length > 0) {
        const idsToDelete = imagesToDelete.map((img) => img.id);
        await prisma.image.deleteMany({
          where: {
            id: { in: idsToDelete },
            complexId: complexId,
          },
        });
      }

      if (update) {
        const primaryImage = update.find((img) => img.isPrimary);

        await prisma.image.updateMany({
          where: { complexId: complexId },
          data: { isPrimary: false },
        });

        if (primaryImage) {
          await prisma.image.update({
            where: { id: primaryImage.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    return NextResponse.json({ message: "Imágenes actualizadas exitosamente" });
  } catch (error) {
    console.error("[SETTINGS_IMAGES_PUT_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}


export async function DELETE(req: Request, context: { params: Promise<{ id: string, imageId: string }> }
) {
  try {
    const { id: complexId, imageId } = await context.params;
    const { error } = await authorizeAndVerify(complexId);
    if (error) return error;

    const image = await db.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return new NextResponse("Imagen no encontrada", { status: 404 });
    }

    if (image.complexId !== complexId) {
      return new NextResponse("La imagen no pertenece a este complejo", {
        status: 403,
      });
    }

    if (image.isPrimary) {
      return new NextResponse(
        "No se puede eliminar la imagen de portada. Asigna otra como principal primero.",
        { status: 400 }
      );
    }

    await db.image.delete({
      where: {
        id: imageId,
      },
    });

    return NextResponse.json({ message: "Imagen eliminada exitosamente" });
  } catch (error) {
    console.error("[IMAGE_DELETE]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
