import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";


export const getComplexDataForManager = async (complexId: string, managerId: string) => {
  try {
    const complex = await db.complex.findUnique({
      where: {
        id: complexId,
        managerId: managerId, 
      },
      include: {
        courts: {
          include: {
            bookings: true,
          },
        },
      },
    });

    if (!complex) {
      return null;
    }

    // --- Aquí puedes calcular las métricas que necesites ---
    // Ejemplo:
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservationsToday = complex.courts
      .flatMap(court => court.bookings)
      .filter(booking => new Date(booking.date) >= today).length;

    const totalIncomeToday = complex.courts
        .flatMap(court => court.bookings)
        .filter(booking => new Date(booking.date) >= today)
        .reduce((sum, booking) => sum + booking.depositPaid, 0);


    // Devolvemos los datos procesados
    return {
      name: complex.name,
      reservationsToday,
      totalIncomeToday,
      // ...puedes añadir más métricas aquí
    };

  } catch (error) {
    console.error("Error al obtener datos del complejo:", error);
    return null;
  }
};
