import { db } from "@/shared/lib/db";
import { BookingStatus, TransactionType } from "@prisma/client";
import { startOfDay, endOfDay, addDays, getDay } from "date-fns";

const parseHour = (
  hourString: string | number | null | undefined
): number | null => {
  if (hourString === null || hourString === undefined) return null;
  if (typeof hourString === "number") return hourString;
  try {
    const [hour] = hourString.split(":");
    const hourNum = parseInt(hour, 10);
    return isNaN(hourNum) ? null : hourNum;
  } catch (e) {
    return null;
  }
};

export async function getComplexDataForManager(
  complexId: string,
  managerId: string
) {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const endOfToday = endOfDay(now);
  const endOfNext7Days = endOfDay(addDays(now, 7));

  // 1. Obtenemos los datos del complejo y las canchas en una sola consulta
  const complex = await db.complex.findFirst({
    where: { id: complexId, managerId },
    select: {
      id: true,
      name: true,
      onboardingCompleted: true,
      openHour: true,
      closeHour: true,
      averageRating: true,
      reviewCount: true,
      courts: {
        include: {
          priceRules: true,
        },
      },
      schedule: true,
    },
  });

  if (!complex) {
    return null;
  }

  const [
    todayBookings,
    next7DaysBookings,
    upcomingBookings,
    todayTransactions,
  ] = await Promise.all([
    db.booking.findMany({
      where: {
        court: { complexId },
        date: { gte: startOfToday, lte: endOfToday },
        status: { in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO] },
      },
    }),
    db.booking.findMany({
      where: {
        court: { complexId },
        date: { gte: startOfToday, lte: endOfNext7Days },
        status: { in: [BookingStatus.CONFIRMADO, BookingStatus.PENDIENTE] },
      },
    }), 
    db.booking.findMany({
      where: {
        court: { complexId },
        status: BookingStatus.CONFIRMADO,
        OR: [
          { date: { gt: startOfToday } },
          {
            date: startOfToday,
            startTime: { gte: now.getHours() },
          },
        ],
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
      include: { court: { select: { name: true } } },
    }),
    db.transaction.findMany({
      where: {
        complexId: complexId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        bookingPlayer: {
          include: { booking: { select: { status: true } } },
        },
      },
    }),
  ]);

  // 3. Calculamos todos los KPIs
  const validTodayTransactions = todayTransactions.filter((tx) => {
    if (tx.bookingPlayer && tx.bookingPlayer.booking) {
      return tx.bookingPlayer.booking.status !== BookingStatus.CANCELADO;
    }
    return true;
  });

  // Calculamos Ingresos Brutos (el número correcto de "Ingresos del Día")
  const totalIncomeToday = validTodayTransactions
    .filter((tx) => tx.type === TransactionType.INGRESO)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenseToday = validTodayTransactions
    .filter((tx) => tx.type === TransactionType.EGRESO)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const netIncomeToday = totalIncomeToday - totalExpenseToday;

  const todayDayOfWeek = getDay(now);
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayKey = dayKeys[todayDayOfWeek] as keyof typeof complex.schedule;

  const openHourString =
    complex.schedule?.[`${todayKey}Open`] ?? complex.openHour;
  const closeHourString =
    complex.schedule?.[`${todayKey}Close`] ?? complex.closeHour;

  const openHour = parseHour(openHourString) ?? 9;
  const closeHour = parseHour(closeHourString) ?? 23;
  const totalHoursAvailableToday =
    complex.courts.length * (closeHour - openHour);

  const hoursBookedToday = todayBookings.length;
  const occupancyRate =
    totalHoursAvailableToday > 0
      ? Math.round((hoursBookedToday / totalHoursAvailableToday) * 100)
      : 0;

  const reservationsNext7Days = next7DaysBookings.length;
  const pendingIncomeNext7Days = next7DaysBookings.reduce(
    (sum, b) => sum + b.remainingBalance,
    0
  );
  const occupancyNext7Days = 50;

  return {
    id: complex.id,
    name: complex.name,
    onboardingCompleted: complex.onboardingCompleted,
    reservationsToday: todayBookings.length,
    totalIncomeToday: netIncomeToday,
    occupancyRate,
    reservationsNext7Days,
    pendingIncomeNext7Days, 
    occupancyNext7Days,
    averageRating: complex.averageRating,
    reviewCount: complex.reviewCount,
    upcomingBookings: upcomingBookings.map((b) => ({
      id: b.id,
      guestName: b.guestName || "Usuario",
      courtName: b.court.name,
      date: b.date,
      startTime: `${String(b.startTime).padStart(2, "0")}:${String(
        b.startMinute
      ).padStart(2, "0")}`,
      isPaid: b.remainingBalance === 0,
    })),
  };
}
