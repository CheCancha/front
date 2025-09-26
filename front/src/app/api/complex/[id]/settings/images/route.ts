import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { z } from "zod";

const imagesSchema = z.array(
  z.object({
    id: z.string(),
    isPrimary: z.boolean(),
  })
);

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complexId } = await context.params;
    const { error } = await authorizeAndVerify(complexId);
    if (error) return error;

    const body = await req.json();
    const validation = imagesSchema.safeParse(body.images);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: validation.error.format() }),
        { status: 400 }
      );
    }

    const imagesData = validation.data;
    const primaryImage = imagesData.find((img) => img.isPrimary);

    await db.$transaction(async (prisma) => {
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
    });

    return NextResponse.json({ message: "Imágenes actualizadas exitosamente" });
  } catch (error) {
    console.error("[SETTINGS_IMAGES_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
