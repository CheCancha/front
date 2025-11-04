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
        // 3. Aplicamos el resto de basicInfo
        ...restOfBasicInfo,
        slug: newSlug,

        // 4. Aplicamos los otros campos (horarios, etc.)
        openHour: general?.openHour,
        closeHour: general?.closeHour,
        amenities: { set: amenities.connect },
        courts: { create: courts.create },

        // 5. Aplicamos la lógica de teléfonos que hicimos para la otra API
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

    console.log(`✅ [SETTINGS_PUT] Se intentó actualizar 'onboardingCompleted' a 'true' para el complejo: ${id}`);

    // LOG DE VERIFICACIÓN FINAL: Volvemos a leer el valor desde la BD
    const updatedComplex = await db.complex.findUnique({
        where: { id },
        select: { onboardingCompleted: true }
    });
    console.log("✅ [SETTINGS_PUT] Verificación post-actualización. El valor en la BD ahora es:", updatedComplex?.onboardingCompleted);

    return NextResponse.json({ message: "Configuración guardada exitosamente" });

  } catch (error) {
    console.error("❌ [SETTINGS_PUT] Error en el endpoint:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}