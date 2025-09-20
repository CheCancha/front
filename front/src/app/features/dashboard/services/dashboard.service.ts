import { db } from "@/shared/lib/db";

export const getComplexDataForManager = async (complexId: string, managerId: string) => {
  try {
    const complex = await db.complex.findUnique({
      where: { id: complexId, managerId: managerId },
      include: { courts: { include: { bookings: true } } },
    });

    if (!complex) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const allBookings = complex.courts.flatMap(court => court.bookings);
    const bookingsToday = allBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= today && bookingDate < tomorrow;
    });

    const reservationsTodayCount = bookingsToday.length;
    const totalIncomeToday = bookingsToday.reduce((sum, booking) => sum + booking.totalPrice, 0);

    return {
      name: complex.name,
      onboardingCompleted: complex.onboardingCompleted,
      reservationsToday: reservationsTodayCount,
      totalIncomeToday,
    };

  } catch (error) {
    console.error("Error al obtener datos del complejo:", error);
    return null;
  }
};