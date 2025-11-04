import { db } from "@/shared/lib/db";


export async function checkOnboarding(complexId: string) {
  try {

    const complex = await db.complex.findUnique({
      where: { id: complexId },
      include: {
        _count: {
          select: { courts: true },
        },
        schedule: true,
      },
    });

    if (!complex) {
      console.warn(`[Onboarding Check] No se encontró el complejo ${complexId}.`);
      return;
    }

    // 1. Condición: ¿Tiene al menos una cancha?
    const hasCourts = complex._count.courts > 0;

    // 2. Condición: ¿Tiene al menos un día con horario definido?
    const hasSchedule = complex.schedule && (
      complex.schedule.mondayOpen !== null ||
      complex.schedule.tuesdayOpen !== null ||
      complex.schedule.wednesdayOpen !== null ||
      complex.schedule.thursdayOpen !== null ||
      complex.schedule.fridayOpen !== null ||
      complex.schedule.saturdayOpen !== null ||
      complex.schedule.sundayOpen !== null
    );

    // 3. Condición: ¿Está conectado a Mercado Pago?
    const isMpConnected = complex.mp_connected_at !== null;


    // Si todas las condiciones se cumplen Y el onboarding aún no está completo...
    if (hasCourts && hasSchedule && isMpConnected && !complex.onboardingCompleted) {
      await db.complex.update({
        where: { id: complexId },
        data: { onboardingCompleted: true },
      });
      console.log(`🎉 [Onboarding Check] ¡Onboarding completado para el complejo ${complexId}!`);
    } else {
      console.log(`[Onboarding Check] El complejo ${complexId} aún no cumple todos los criterios.`);
    }

  } catch (error) {
    console.error(`❌ [Onboarding Check] Error al verificar el complejo ${complexId}:`, error);
  }
}
