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
  context: { params: Promise<{ id: string }> }
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
      return new NextResponse("Complejo no encontrado o sin permiso.", { status: 403 });
    }

    const body = await req.json();
    console.log("✅ [SETTINGS_PUT] Body recibido en la API:", JSON.stringify(body, null, 2));

    const { general, courts, amenities, basicInfo } = body;
    const newName = basicInfo?.name || complexToUpdate.name;
    const newSlug = slugify(newName);

    await db.complex.update({
      where: { id: id },
      data: {
        name: newName,
        slug: newSlug,
        address: basicInfo?.address,
        city: basicInfo?.city,
        province: basicInfo?.province,
        openHour: general?.openHour,
        closeHour: general?.closeHour,
        amenities: { set: amenities.connect },
        courts: { create: courts.create },
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