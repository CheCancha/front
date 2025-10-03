import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { z } from "zod";
import { slugify } from "@/shared/lib/utils";

const generalInfoSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    address: z.string().min(5, "La dirección es muy corta."),
    city: z.string().min(2, "La ciudad es muy corta."),
    province: z.string().min(2, "La provincia es muy corta."),
    contactPhone: z.string().optional().nullable(),
    contactEmail: z.string().email("El formato del email no es válido.").optional().nullable().or(z.literal('')),
    websiteUrl: z.string().url("El formato de la URL no es válido.").optional().nullable().or(z.literal('')),
    instagramHandle: z.string().optional().nullable(),
    facebookUrl: z.string().url("El formato de la URL de Facebook no es válido.").optional().nullable().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
  }),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();

    // --- LOG DE DIAGNÓSTICO EN EL BACKEND ---
    console.log("\n--- [AUDITORÍA BACKEND] ---");
    console.log("Body recibido en /api/settings/general:", JSON.stringify(body, null, 2));
    if (body.basicInfo) {
      console.log("Tipo de 'latitude' recibido:", typeof body.basicInfo.latitude);
      console.log("Tipo de 'longitude' recibido:", typeof body.basicInfo.longitude);
    }
    // --- FIN DEL LOG ---

    const validation = generalInfoSchema.safeParse(body);
    if (!validation.success) {
      console.error("Falló la validación de Zod:", validation.error.format());
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { basicInfo } = validation.data;

    const complex = await db.complex.findFirst({
      where: { id: id, managerId: session.user.id },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado o no tienes permiso.", { status: 404 });
    }
    
    const newSlug = slugify(basicInfo.name);

    await db.complex.update({
      where: { id: id },
      data: {
        ...basicInfo,
        slug: newSlug,
      },
    });

    return NextResponse.json({ message: "Información general actualizada." }, { status: 200 });

  } catch (error) {
    console.error("💥 ERROR en PUT de settings/general:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}