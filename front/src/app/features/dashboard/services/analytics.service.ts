import { db } from "@/shared/lib/db";
import { eachDayOfInterval, getDay } from "date-fns";
import { BookingStatus } from "@prisma/client";

interface AnalyticsParams {
  complexId: string;
  startDate: Date;
  endDate: Date;
  courtIds?: string[];
}

const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export async function getAnalyticsData({
  complexId,
  startDate,
  endDate,
  courtIds,
}: AnalyticsParams) {
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDuration);
  const prevEndDate = new Date(endDate.getTime() - periodDuration);

  const [currentPeriodBookings, previousPeriodBookings, complexData] =
    await Promise.all([
      db.booking.findMany({
        where: {
          court: { complexId, id: courtIds ? { in: courtIds } : undefined },
          date: { gte: startDate, lte: endDate },
          status: { in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO] },
        },
        include: { court: true, user: true },
      }),
      db.booking.findMany({
        where: {
          court: { complexId, id: courtIds ? { in: courtIds } : undefined },
          date: { gte: prevStartDate, lte: prevEndDate },
          status: { in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO] },
        },
        include: { court: true, user: true },
      }),
      db.complex.findUnique({
        where: { id: complexId },
        select: {
          courts: { select: { id: true, name: true } },
          openHour: true,
          closeHour: true,
          schedule: true,
        },
      }),
    ]);

  // --- 2. Calcular KPIs para ambos períodos ---
  const calculateKpis = (bookings: typeof currentPeriodBookings) => {
    const totalIncome = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalBookings = bookings.length;
    const uniqueCustomers = new Set(bookings.map((b) => b.userId)).size;
    const averageTicket = totalBookings > 0 ? totalIncome / totalBookings : 0;

    return { totalIncome, totalBookings, uniqueCustomers, averageTicket };
  };

  const currentKpis = calculateKpis(currentPeriodBookings);
  const previousKpis = calculateKpis(previousPeriodBookings);

  // 3. IMPLEMENTACIÓN DE KPIs: Cálculo de Tasa de Ocupación
  const calculateOccupancy = (bookingsCount: number, courtsCount: number) => {
    if (!complexData || courtsCount === 0) return 0;

    const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
    let totalAvailableHours = 0;

    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    daysInPeriod.forEach((day) => {
      const dayKey = dayKeys[getDay(day)] as keyof typeof complexData.schedule;
      const openHour =
        complexData.schedule?.[`${dayKey}Open`] ?? complexData.openHour ?? 9;
      const closeHour =
        complexData.schedule?.[`${dayKey}Close`] ?? complexData.closeHour ?? 23;
      totalAvailableHours += closeHour - openHour;
    });

    const totalSlots = totalAvailableHours * courtsCount;
    return totalSlots > 0 ? (bookingsCount / totalSlots) * 100 : 0;
  };

  const analyzedCourtsCount =
    courtIds?.length || complexData?.courts.length || 0;
  const currentOccupancy = calculateOccupancy(
    currentKpis.totalBookings,
    analyzedCourtsCount
  );
  const previousOccupancy = calculateOccupancy(
    previousKpis.totalBookings,
    analyzedCourtsCount
  );

  // --- 3. Datos para los gráficos ---
  // Gráfico de Líneas: Ingresos por día
  const dailyIncome = new Map<string, number>();
  currentPeriodBookings.forEach((b) => {
    const day = b.date.toISOString().split("T")[0];
    dailyIncome.set(day, (dailyIncome.get(day) || 0) + b.totalPrice);
  });
  const lineChartData = Array.from(dailyIncome.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Gráfico de Torta: Ingresos por cancha
  const courtIncome = new Map<string, number>();
  currentPeriodBookings.forEach((b) => {
    courtIncome.set(
      b.court.name,
      (courtIncome.get(b.court.name) || 0) + b.totalPrice
    );
  });
  const pieChartData = Array.from(courtIncome.entries()).map(
    ([name, value]) => ({ name, value })
  );

  const heatmapData: { [day: number]: { [hour: number]: number } } = {};
  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const hourLabels: string[] = [];
  const openHour = complexData?.openHour ?? 9;
  const closeHour = complexData?.closeHour ?? 23;

  for (let i = 0; i < 7; i++) {
    heatmapData[i] = {};
  }
  for (let h = openHour; h < closeHour; h++) {
    hourLabels.push(`${h}:00`);
  }

  currentPeriodBookings.forEach((b) => {
    const day = getDay(b.date); // 0 (Dom) a 6 (Sáb)
    const hour = b.startTime;
    if (hour >= openHour && hour < closeHour) {
      heatmapData[day][hour] = (heatmapData[day][hour] || 0) + 1;
    }
  });

  const customerData: { [userId: string]: { name: string, bookingsCount: number, totalSpent: number } } = {};
  currentPeriodBookings.forEach(b => {
    if (b.userId && b.user) {
      if (!customerData[b.userId]) {
        customerData[b.userId] = { name: b.user.name || "Usuario", bookingsCount: 0, totalSpent: 0 };
      }
      customerData[b.userId].bookingsCount++;
      customerData[b.userId].totalSpent += b.totalPrice;
    }
  });
  const topCustomers = Object.values(customerData).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

  const courtsBreakdown = pieChartData.map(court => ({
      name: court.name,
      totalIncome: court.value,
      totalBookings: currentPeriodBookings.filter(b => b.court.name === court.name).length,
  }));

  // --- 4. Ensamblar la respuesta final ---
  return {
    kpis: {
      totalIncome: {
        value: currentKpis.totalIncome,
        change: calculatePercentageChange(
          currentKpis.totalIncome,
          previousKpis.totalIncome
        ),
      },
      totalBookings: {
        value: currentKpis.totalBookings,
        change: calculatePercentageChange(
          currentKpis.totalBookings,
          previousKpis.totalBookings
        ),
      },
      uniqueCustomers: {
        value: currentKpis.uniqueCustomers,
        change: calculatePercentageChange(
          currentKpis.uniqueCustomers,
          previousKpis.uniqueCustomers
        ),
      },
      averageTicket: {
        value: currentKpis.averageTicket,
        change: calculatePercentageChange(
          currentKpis.averageTicket,
          previousKpis.averageTicket
        ),
      },
      occupancyRate: {
        value: currentOccupancy,
        change: calculatePercentageChange(currentOccupancy, previousOccupancy),
      },
    },
    charts: {
      lineChartData,
      pieChartData,
      heatmapData,
      dayLabels,
      hourLabels,
    },
    tables: {
      topCustomers,
      courtsBreakdown,
    },
    filters: {
      availableCourts: complexData?.courts || [],
    },
  };
}
