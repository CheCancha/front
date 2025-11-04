import { NextResponse } from "next/server";
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
    contactPhones: z
      .array(
        z.object({
          phone: z.string().min(1, "El teléfono no puede estar vacío."),
          label: z.string().optional().nullable(),
        })
      )
      .optional(),
    contactEmail: z
      .string()
      .email("El formato del email no es válido.")
      .optional()
      .nullable()
      .or(z.literal("")),
    websiteUrl: z
      .string()
      .url("El formato de la URL no es válido.")
      .optional()
      .nullable()
      .or(z.literal("")), // Este no estaba en tu schema, pero lo dejo por si lo usas
    instagramHandle: z.string().optional().nullable(),
    facebookUrl: z
      .string()
      .url("El formato de la URL de Facebook no es válido.")
      .optional()
      .nullable()
      .or(z.literal("")),
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

    if (body.basicInfo) {
    }

const validation = generalInfoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { basicInfo } = validation.data;

    const complex = await db.complex.findFirst({
      where: { id: id, managerId: session.user.id },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado o no tienes permiso.", {
        status: 404,
      });
    }

    const newSlug = slugify(basicInfo.name);

    const { contactPhones, ...restOfBasicInfo } = basicInfo;

    await db.complex.update({
      where: { id: id },
      data: {
        ...restOfBasicInfo, 
        slug: newSlug,

        // Manejo especial para la relación de teléfonos
        contactPhones: {
          // 1. Borra todos los teléfonos viejos asociados a este complejo
          deleteMany: {},
          // 2. Crea todos los teléfonos que vienen en el array
          create: contactPhones
            ? contactPhones.map((phone) => ({
                phone: phone.phone,
                label: phone.label,
              }))
            : [], // Si no vienen teléfonos, crea un array vacío
        },
      },
    });

    return NextResponse.json(
      { message: "Información general actualizada." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[COMPLEX_GENERAL_PUT]", error); // Buena práctica: loguear el error
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
