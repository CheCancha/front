import { db } from "@/shared/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { BookingStatus } from "@prisma/client";

export const getComplexDataForManager = async (
  complexId: string,
  managerId: string
) => {
  try {
    const complex = await db.complex.findFirst({
      where: { id: complexId, managerId: managerId },
      include: {
        courts: {
          include: {
            bookings: {
              where: {
                date: {
                  gte: startOfDay(new Date()),
                  lte: endOfDay(new Date()),
                },
                status: {
                  in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO],
                },
              },
            },
          },
        },
        schedule: true,
      },
    });

    if (!complex) {
      return null;
    }

    let totalIncomeToday = 0;
    let reservationsToday = 0;

    complex.courts.forEach((court) => {
      reservationsToday += court.bookings.length;
      court.bookings.forEach((booking) => {
        totalIncomeToday += booking.depositPaid;
      });
    });

    const confirmedOrCompletedReservations = reservationsToday;

    // Tasa de Ocupación
    const now = new Date();
    const dayOfWeek = now
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase() as keyof typeof complex.schedule;
    const openKey = `${dayOfWeek}Open` as keyof typeof complex.schedule;
    const closeKey = `${dayOfWeek}Close` as keyof typeof complex.schedule;

    let totalAvailableHours = 0;
    if (
      complex.schedule &&
      complex.schedule[openKey] !== null &&
      complex.schedule[closeKey] !== null
    ) {
      const openHour = complex.schedule[openKey] as number;
      const closeHour = complex.schedule[closeKey] as number;
      totalAvailableHours = (closeHour - openHour) * complex.courts.length;
    }

    const occupancyRate =
      totalAvailableHours > 0
        ? Math.round(
            (confirmedOrCompletedReservations / totalAvailableHours) * 100
          )
        : 0;

    return {
      onboardingCompleted: complex.onboardingCompleted,
      totalIncomeToday,
      reservationsToday,
      occupancyRate,
    };
  } catch (error) {
    console.error("Error al obtener datos del complejo:", error);
    return null;
  }
};
