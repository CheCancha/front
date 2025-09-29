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

    // 1. Buscamos el complejo específico del manager
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
        amenities: true, // <-- Incluimos las amenities que YA tiene el complejo
      },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    // 2. Buscamos TODAS las amenities disponibles para los checkboxes
    const allAmenities = await db.amenity.findMany({
      orderBy: { name: 'asc' }
    });

    // 3. Devolvemos AMBOS resultados en un solo objeto
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

    // 1. Autorización
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

    // 2. Procesar el payload del formulario
    const body = await req.json();
    const { general, courts, amenities, basicInfo } = body;

    const newName = basicInfo?.name || complexToUpdate.name;
    const newSlug = slugify(newName);

    // 3. Actualizar la base de datos en una sola transacción
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
        onboardingCompleted: true,

        amenities: {
          set: amenities.connect,
        },

        courts: {
          create: courts.create,
        },
      },
    });

    return NextResponse.json({ message: "Configuración guardada exitosamente" });

  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

