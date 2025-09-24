import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { Prisma } from "@prisma/client";

// Tipos para el payload

type BasicInfoPayload = {
  name: string;
  address: string;
  city: string;
  province: string;
};

type GeneralPayload = {
  openHour?: number | null;
  closeHour?: number | null;
};

type SchedulePayload = {
  mondayOpen?: number | null;
  mondayClose?: number | null;
  tuesdayOpen?: number | null;
  tuesdayClose?: number | null;
  wednesdayOpen?: number | null;
  wednesdayClose?: number | null;
  thursdayOpen?: number | null;
  thursdayClose?: number | null;
  fridayOpen?: number | null;
  fridayClose?: number | null;
  saturdayOpen?: number | null;
  saturdayClose?: number | null;
  sundayOpen?: number | null;
  sundayClose?: number | null;
};

type CourtUpdatePayload = {
  id: string;
  name: string;
  sportId: string;
  slotDurationMinutes: number;
};

type CourtCreatePayload = {
  name: string;
  sportId: string;
  slotDurationMinutes: number;
};

type CourtsPayload = {
  update: CourtUpdatePayload[];
  create: CourtCreatePayload[];
  delete: string[];
};

type ImagePayload = {
  id: string;
  isPrimary: boolean;
};

// GET: Obtener todos los datos del complejo
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Complex ID recibido en GET:", id);

    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Buscar el complejo con todos los datos relacionados
    const complex = await db.complex.findFirst({
      where: {
        id: id,
        managerId: session.user.id,
      },
      include: {
        schedule: true,
        courts: {
          orderBy: { name: "asc" },
          include: {
            sport: true,
            priceRules: true,
          },
        },
        images: { orderBy: [{ isPrimary: "desc" }, { id: "asc" }] },
      },
    });

    if (!complex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    return NextResponse.json(complex);
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// PUT: Actualizar todos los datos del complejo
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Complex ID recibido en PUT:", id);

    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Verificar que el complejo pertenece al usuario
    const existingComplex = await db.complex.findFirst({
      where: {
        id: id,
        managerId: session.user.id,
      },
    });

    if (!existingComplex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    // 3. Parsear el payload
    const body = await req.json();
    const { basicInfo, general, schedule, courts, images } = body as {
      basicInfo?: BasicInfoPayload;
      general?: GeneralPayload;
      schedule?: SchedulePayload;
      courts?: CourtsPayload;
      images?: ImagePayload[];
    };

    // 4. Ejecutar todas las actualizaciones en una transacción
    const result = await db.$transaction(async (prisma) => {
      // A. Actualizar información básica del complejo
      const complexUpdateData: Prisma.ComplexUpdateInput = {};

      if (basicInfo) {
        complexUpdateData.name = basicInfo.name;
        complexUpdateData.address = basicInfo.address;
        complexUpdateData.city = basicInfo.city;
        complexUpdateData.province = basicInfo.province;
      }

      if (general) {
        if (general.openHour !== undefined)
          complexUpdateData.openHour = general.openHour;
        if (general.closeHour !== undefined)
          complexUpdateData.closeHour = general.closeHour;
      }

      // Marcar onboarding como completo si no estaba
      if (!existingComplex.onboardingCompleted) {
        complexUpdateData.onboardingCompleted = true;
      }

      const updatedComplex = await prisma.complex.update({
        where: { id: id },
        data: complexUpdateData,
      });

      // B. Actualizar o crear schedule
      if (schedule) {
        await prisma.schedule.upsert({
          where: { complexId: id },
          update: schedule,
          create: {
            complexId: id,
            ...schedule,
          },
        });
      }

      // C. Operaciones con canchas
      if (courts) {
        if (courts.delete && courts.delete.length > 0) {
          await prisma.court.deleteMany({
            where: {
              id: { in: courts.delete },
              complexId: id,
            },
          });
        }

        // Actualizar canchas existentes
        if (courts.update && courts.update.length > 0) {
          for (const court of courts.update) {
            await prisma.court.update({
              where: {
                id: court.id,
                complexId: id,
              },
              data: {
                name: court.name,
                sportId: court.sportId,
                slotDurationMinutes: Number(court.slotDurationMinutes),
              },
            });
          }
        }

        // Crear nuevas canchas
        if (courts.create && courts.create.length > 0) {
          await prisma.court.createMany({
            data: courts.create.map((court) => ({
              name: court.name,
              sportId: court.sportId,
              slotDurationMinutes: Number(court.slotDurationMinutes),
              complexId: id,
            })),
          });
        }
      }

      // D. Actualizar imágenes (marcar como primaria)
      if (images && images.length > 0) {
        for (const image of images) {
          await prisma.image.update({
            where: {
              id: image.id,
              complexId: id,
            },
            data: {
              isPrimary: image.isPrimary,
            },
          });
        }
      }

      const updatedComplexWithDetails = await prisma.complex.findUnique({
        where: { id },
        include: {
          schedule: true,
          courts: { include: { sport: true, priceRules: true } },
          images: true,
        },
      });

      return updatedComplexWithDetails;
    });

    return NextResponse.json({
      message: "Configuración actualizada exitosamente",
      complex: result,
    });
  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// DELETE: Eliminar el complejo completo (opcional, para casos extremos)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Complex ID recibido en DELETE:", id);

    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Verificar que el complejo pertenece al usuario
    const existingComplex = await db.complex.findFirst({
      where: {
        id: id,
        managerId: session.user.id,
      },
    });

    if (!existingComplex) {
      return new NextResponse("Complejo no encontrado", { status: 404 });
    }

    // 3. Eliminar el complejo (las relaciones se eliminarán por cascade)
    await db.complex.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Complejo eliminado exitosamente" });
  } catch (error) {
    console.error("[SETTINGS_DELETE]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
