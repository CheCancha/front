import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { slugify } from "@/shared/lib/utils";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const complex = await db.complex.findFirst({
      where: { id: id, managerId: session.user.id },
      include: {
        schedule: true,
        courts: {
          orderBy: { name: "asc" },
          include: {
            sport: true,
            priceRules: { orderBy: { startTime: "asc" } },
          },
        },
        images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        amenities: true,
        contactPhones: true,
      },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    const allAmenities = await db.amenity.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      complex,
      allAmenities,
    });

  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const complexToUpdate = await db.complex.findFirst({
      where: { id: id, managerId: session.user.id },
    });

    if (!complexToUpdate) {
      return new NextResponse("Complejo no encontrado o sin permiso.", {
        status: 403,
      });
    }

    const body = await req.json();
    const { general, courts, amenities, basicInfo } = body;

    // 1. Separamos los teléfonos del resto de la info general
    const { contactPhones, ...restOfBasicInfo } = basicInfo;

    // 2. Calculamos el nuevo slug
    const newSlug = slugify(restOfBasicInfo.name || complexToUpdate.name);

    await db.complex.update({
      where: { id: id },
      data: {
        ...restOfBasicInfo,
        slug: newSlug,

        openHour: general?.openHour,
        closeHour: general?.closeHour,
        amenities: { set: amenities.connect },
        courts: { create: courts.create },

        contactPhones: {
          deleteMany: {},
          create: contactPhones
            ? contactPhones.map((phone: { phone: string; label?: string | null }) => ({
                phone: phone.phone,
                label: phone.label,
              }))
            : [],
        },
      },
    });

    // LOG DE VERIFICACIÓN FINAL: Volvemos a leer el valor desde la BD
    const updatedComplex = await db.complex.findUnique({
        where: { id },
        select: { onboardingCompleted: true }
    });

    return NextResponse.json({ message: "Configuración guardada exitosamente" });

  } catch (error) {
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}