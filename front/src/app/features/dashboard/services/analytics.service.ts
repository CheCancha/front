import { db } from "@/shared/lib/db";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  getDay,
} from "date-fns";
import { BookingStatus, TransactionType } from "@prisma/client";
import { es } from "date-fns/locale";

// --- TIPOS ---
interface KPI {
  value: number;
  change: number;
}

interface AnalyticsKpis {
  totalIncome: KPI;
  totalBookings: KPI;
  uniqueCustomers: KPI;
  averageTicket: KPI;
  occupancyRate: KPI;
}

interface LineChartPoint {
  name: string;
  total: number;
}

interface PieChartSlice {
  name: string;
  value: number;
}

interface HeatmapData {
  [day: number]: { [hour: number]: number };
}

interface AnalyticsCharts {
  lineChartData: LineChartPoint[];
  pieChartData: PieChartSlice[];
  heatmapData: HeatmapData;
  dayLabels: string[];
  hourLabels: string[];
}

interface TopCustomer {
  name: string;
  bookingsCount: number;
  totalSpent: number;
}

interface CourtBreakdown {
  name: string;
  totalIncome: number;
  totalBookings: number;
}

interface AnalyticsTables {
  topCustomers: TopCustomer[];
  courtsBreakdown: CourtBreakdown[];
}

interface AnalyticsFilters {
  availableCourts: { id: string; name: string; slotDurationMinutes: number }[];
}

export interface AnalyticsData {
  kpis: AnalyticsKpis;
  charts: AnalyticsCharts;
  tables: AnalyticsTables;
  filters: AnalyticsFilters;
}
interface AnalyticsParams {
  complexId: string;
  startDate: Date;
  endDate: Date;
  courtIds?: string[];
}

type BookingWithCourtAndUser = Awaited<
  ReturnType<typeof db.booking.findMany>
>[number];

const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

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

export async function getAnalyticsData({
  complexId,
  startDate,
  endDate,
  courtIds,
}: AnalyticsParams) {
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDuration);
  const prevEndDate = new Date(endDate.getTime() - periodDuration);

  const courtIdFilter = courtIds ? { in: courtIds } : undefined;

  const [
    currentPeriodTransactions,
    previousPeriodTransactions,
    currentPeriodBookings,
    previousPeriodBookings,
    complexData,
  ] = await Promise.all([
    // --- Consultas Financieras (Basadas en Transactions) ---
    db.transaction.findMany({
      where: {
        complexId: complexId,
        createdAt: { gte: startDate, lte: endDate },
        // (Opcional) Filtro de cancha si Transaction tuviera courtId
      },
      include: {
        bookingPlayer: {
          include: {
            booking: {
              select: { status: true, courtId: true },
            },
          },
        },
      },
    }),
    db.transaction.findMany({
      where: {
        complexId: complexId,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      },
      include: {
        bookingPlayer: {
          include: {
            booking: {
              select: { status: true, courtId: true },
            },
          },
        },
      },
    }),
    // --- Consultas Operativas (Basadas en Bookings) ---
    db.booking.findMany({
      where: {
        court: { complexId, id: courtIdFilter },
        date: { gte: startDate, lte: endDate },
        status: { in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO] },
      },
      include: { court: true, user: true },
    }),
    db.booking.findMany({
      where: {
        court: { complexId, id: courtIdFilter },
        date: { gte: prevStartDate, lte: prevEndDate },
        status: { in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO] },
      },
    }),
    // --- Consulta de Complejo (Sin cambios) ---
    db.complex.findUnique({
      where: { id: complexId },
      select: {
        courts: { select: { id: true, name: true, slotDurationMinutes: true } },
        openHour: true,
        closeHour: true,
        schedule: true,
      },
    }),
  ]);

  // --- 3. FILTRAR TRANSACCIONES CANCELADAS ---
  const filterValidTransactions = (
    transactions: typeof currentPeriodTransactions
  ) => {
    return transactions
      .filter((tx) => {
        if (
          tx.source === "RESERVA" &&
          tx.bookingPlayer &&
          tx.bookingPlayer.booking
        ) {
          return tx.bookingPlayer.booking.status !== BookingStatus.CANCELADO;
        }
        return true; // Contar Egresos y Ventas de Cantina
      })
      .filter((tx) => {
        // Filtrar por courtIds si aplica
        if (!courtIds) return true; // Si no hay filtro de cancha, incluir todo
        if (tx.bookingPlayer && tx.bookingPlayer.booking) {
          return courtIds.includes(tx.bookingPlayer.booking.courtId);
        }
        // (Si 'GASTO' o 'VENTA_PRODUCTO' no tienen courtId, se incluirán siempre)
        // (Si necesitas que GASTO también se filtre, necesitaría un courtId)
        return tx.source !== "RESERVA";
      });
  };

  const validCurrentTransactions = filterValidTransactions(
    currentPeriodTransactions
  );
  const validPreviousTransactions = filterValidTransactions(
    previousPeriodTransactions
  );

  // --- 4. Calcular KPIs ---
  const calculateFinancialKpis = (
    transactions: typeof validCurrentTransactions
  ) => {
    const totalIncome = transactions
      .filter((tx) => tx.type === TransactionType.INGRESO)
      .reduce((sum, t) => sum + t.amount, 0);
    // (Podríamos añadir egresos aquí si el KPI lo necesitara)
    return { totalIncome };
  };

  // Función para KPIs basados en Bookings (Operativo)
  const calculateOperationalKpis = (bookings: BookingWithCourtAndUser[]) => {
    const totalBookings = bookings.length;
    const uniqueCustomers = new Set(bookings.map((b) => b.userId)).size;
    const totalIncomeBookings = bookings.reduce(
      (sum, b) => sum + b.totalPrice,
      0
    );
    const averageTicket =
      totalBookings > 0 ? totalIncomeBookings / totalBookings : 0;
    return { totalBookings, uniqueCustomers, averageTicket };
  };

  // Calculamos ambos
  const currentFinancialKpis = calculateFinancialKpis(validCurrentTransactions);
  const previousFinancialKpis = calculateFinancialKpis(
    validPreviousTransactions
  );
  const currentOperationalKpis = calculateOperationalKpis(
    currentPeriodBookings
  );
  const previousOperationalKpis = calculateOperationalKpis(
    previousPeriodBookings
  );

  // 5. Cálculo de Tasa de Ocupación (Sin cambios)
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
      const openString =
        complexData.schedule?.[`${dayKey}Open`] ??
        complexData.openHour ??
        "9:00";
      const closeString =
        complexData.schedule?.[`${dayKey}Close`] ??
        complexData.closeHour ??
        "23:00";
      const openHour = parseHour(openString) ?? 9;
      const closeHour = parseHour(closeString) ?? 23;
      totalAvailableHours += closeHour - openHour;
    });

    const totalSlots =
      (totalAvailableHours /
        (complexData.courts[0]?.slotDurationMinutes / 60 || 1)) *
      courtsCount; // Asumimos slots de 1hr o slotDuration
    return totalSlots > 0 ? (bookingsCount / totalSlots) * 100 : 0;
  };

  const analyzedCourtsCount =
    courtIds?.length || complexData?.courts.length || 0;
  const currentOccupancy = calculateOccupancy(
    currentOperationalKpis.totalBookings,
    analyzedCourtsCount
  );
  const previousOccupancy = calculateOccupancy(
    previousOperationalKpis.totalBookings,
    analyzedCourtsCount
  );

  // GRÁFICO DE LÍNEA (BASADO EN TRANSACCIONES VÁLIDAS)
  let formattedData: { name: string; total: number }[] = [];
  const differenceInDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

  if (differenceInDays < 32) {
    // Lógica Diaria
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyIncome: { [key: string]: number } = {};

    for (const transaction of currentPeriodTransactions) {
      const dayKey = format(transaction.createdAt, "dd/MM");
      dailyIncome[dayKey] = (dailyIncome[dayKey] || 0) + transaction.amount;
    }

    formattedData = days.map((day) => {
      const dayKey = format(day, "dd/MM");
      return {
        name: format(day, "d MMM", { locale: es }),
        total: dailyIncome[dayKey] || 0,
      };
    });
  } else {
    // Lógica Mensual
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthlyIncome: { [key: string]: number } = {};

    for (const transaction of currentPeriodTransactions) {
      const monthKey = format(transaction.createdAt, "yyyy-MM");
      monthlyIncome[monthKey] =
        (monthlyIncome[monthKey] || 0) + transaction.amount;
    }

    formattedData = months.map((month) => {
      const monthKey = format(month, "yyyy-MM");
      return {
        name: format(month, "MMM", { locale: es }),
        total: monthlyIncome[monthKey] || 0,
      };
    });
  }
  const lineChartData = formattedData;

  // Gráfico de Torta: Ingresos por cancha
  const courtIncome = new Map<string, { name: string; total: number }>();
  // Mapeamos ID de cancha a Nombre de cancha
  const courtIdToNameMap = new Map<string, string>();
  complexData?.courts.forEach((c) => courtIdToNameMap.set(c.id, c.name));

  for (const tx of validCurrentTransactions) {
    if (
      tx.type === TransactionType.INGRESO &&
      tx.bookingPlayer &&
      tx.bookingPlayer.booking
    ) {
      const courtId = tx.bookingPlayer.booking.courtId;
      const courtName = courtIdToNameMap.get(courtId) || "Cancha Desconocida";

      const current = courtIncome.get(courtId) || { name: courtName, total: 0 };
      current.total += tx.amount;
      courtIncome.set(courtId, current);
    }
  }
  const pieChartData = Array.from(courtIncome.values()).map((item) => ({
    name: item.name,
    value: item.total, // El gráfico de torta espera 'value'
  }));

  const heatmapData: { [day: number]: { [hour: number]: number } } = {};
  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const hourLabels: string[] = [];

  const openHour = parseHour(complexData?.openHour) ?? 9;
  const closeHour = parseHour(complexData?.closeHour) ?? 23;

  // 1. Inicializamos la grilla con ceros (0)
  for (let i = 0; i < 7; i++) {
    heatmapData[i] = {};
    for (let h = openHour; h < closeHour; h++) {
      if (i === 0) {
        hourLabels.push(`${h}:00`);
      }
      heatmapData[i][h] = 0;
    }
  }

  currentPeriodBookings.forEach((b) => {
    const day = getDay(b.date); // 0 (Dom) - 6 (Sáb)
    const hour = b.startTime; // Asumimos que startTime es la hora (ej: 18)
    if (hour >= openHour && hour < closeHour) {
      heatmapData[day][hour] = (heatmapData[day][hour] || 0) + 1;
    }
  });

  const customerData: {
    [userId: string]: {
      name: string;
      bookingsCount: number;
      totalSpent: number;
    };
  } = {};
  currentPeriodBookings.forEach((b) => {
    if (b.userId && b.user) {
      if (!customerData[b.userId]) {
        customerData[b.userId] = {
          name: b.user.name || "Usuario",
          bookingsCount: 0,
          totalSpent: 0,
        };
      }
      customerData[b.userId].bookingsCount++;
      customerData[b.userId].totalSpent += b.totalPrice;
    }
  });
  const topCustomers = Object.values(customerData)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const courtsBreakdown = Array.from(courtIncome.values()).map((court) => ({
    name: court.name,
    totalIncome: court.total,
    totalBookings: currentPeriodBookings.filter(
      (b) => courtIdToNameMap.get(b.courtId) === court.name
    ).length,
  }));

  // --- 4. Ensamblar la respuesta final ---
  return {
    kpis: {
      totalIncome: {
        value: currentFinancialKpis.totalIncome,
        change: calculatePercentageChange(
          currentFinancialKpis.totalIncome,
          previousFinancialKpis.totalIncome
        ),
      },
      totalBookings: {
        value: currentOperationalKpis.totalBookings,
        change: calculatePercentageChange(
          currentOperationalKpis.totalBookings,
          previousOperationalKpis.totalBookings
        ),
      },
      uniqueCustomers: {
        value: currentOperationalKpis.uniqueCustomers,
        change: calculatePercentageChange(
          currentOperationalKpis.uniqueCustomers,
          previousOperationalKpis.uniqueCustomers
        ),
      },
      averageTicket: {
        value: currentOperationalKpis.averageTicket,
        change: calculatePercentageChange(
          currentOperationalKpis.averageTicket,
          previousOperationalKpis.averageTicket
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
