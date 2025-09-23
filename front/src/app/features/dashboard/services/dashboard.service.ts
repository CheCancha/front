import { db } from "@/shared/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import type { Court } from "@prisma/client";

export async function getComplexDataForManager(complexId: string, userId: string) {
  try {
    // CORRECCIÓN: Se cambió 'userId' por 'managerId' para coincidir con el esquema de Prisma.
    const complex = await db.complex.findFirst({
      where: {
        id: complexId,
        managerId: userId, // Chequeo de seguridad clave
      },
      include: {
        courts: true, // Incluimos las canchas para calcular la ocupación
      },
    });

    if (!complex) {
      return null;
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Obtenemos todas las reservas de hoy para este complejo
    const todaysBookings = await db.booking.findMany({
      where: {
        court: {
          complexId: complexId,
        },
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        court: {
            select: {
                slotDurationMinutes: true
            }
        }
      }
    });

    // Métrica 1: Ingresos del día
    // CORRECCIÓN: Se ajusta la lógica para sumar ingresos confirmados/completados y restar los cancelados.
    const totalIncomeToday = todaysBookings.reduce((sum, booking) => {
      if (booking.status === "CONFIRMADO" || booking.status === "COMPLETADO") {
        return sum + booking.depositPaid;
      }
      if (booking.status === "CANCELADO") {
        return sum - booking.depositPaid;
      }
      return sum; // Los turnos pendientes no afectan el cálculo.
    }, 0);


    // Métrica 2: Total de reservas de hoy
    const reservationsToday = todaysBookings.length;

    // Métrica 3: Tasa de Ocupación
    // CORRECCIÓN: Se añadieron tipos explícitos para evitar errores de 'implicit any'.
    const totalAvailableMinutes = complex.courts.reduce((sum: number, court: Court) => {
        // CORRECCIÓN: Los horarios de apertura/cierre se toman del complejo, no de la cancha.
        const open = complex.openHour ?? 9;
        const close = complex.closeHour ?? 23;
        return sum + (close - open) * 60;
    }, 0);

    const confirmedOrCompletedBookings = todaysBookings.filter(
      (b) => b.status === "CONFIRMADO" || b.status === "COMPLETADO"
    );

    const totalBookedMinutes = confirmedOrCompletedBookings.reduce((sum, booking) => {
        return sum + booking.court.slotDurationMinutes;
    }, 0);
    
    const occupancyRate = totalAvailableMinutes > 0 
        ? Math.round((totalBookedMinutes / totalAvailableMinutes) * 100) 
        : 0;

    // Devolvemos todos los datos calculados
    return {
      onboardingCompleted: complex.onboardingCompleted,
      totalIncomeToday,
      reservationsToday,
      occupancyRate,
    };
  } catch (error) {
    console.error("Error al obtener los datos del dashboard:", error);
    return null;
  }
}