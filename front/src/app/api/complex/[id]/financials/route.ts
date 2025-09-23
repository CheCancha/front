import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

// Función para obtener el nombre del día (Ej: "Lun") a partir de una fecha
const getDayName = (date: Date) => {
  const day = format(date, 'eee', { locale: es });
  return day.charAt(0).toUpperCase() + day.slice(1);
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const startDateString = searchParams.get("startDate");
    const endDateString = searchParams.get("endDate");

    if (!startDateString || !endDateString) {
      return new NextResponse("Los parámetros 'startDate' y 'endDate' son obligatorios", { status: 400 });
    }

    const startDate = startOfDay(parseISO(startDateString));
    const endDate = endOfDay(parseISO(endDateString));

    // Busca reservas confirmadas o completadas en el rango de fechas
    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: id },
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMADO", "COMPLETADO"],
        },
      },
      select: {
        date: true,
        totalPrice: true,
      },
      orderBy: {
        date: 'asc',
      }
    });

    // Agrupa las ventas por día para sumar los totales
    const dailySales = new Map<string, number>();
    for (const booking of bookings) {
      const dayKey = format(booking.date, 'yyyy-MM-dd');
      const currentSales = dailySales.get(dayKey) || 0;
      dailySales.set(dayKey, currentSales + booking.totalPrice);
    }
    
    // Formatea los datos para que el gráfico los pueda usar
    const chartData = Array.from(dailySales.entries()).map(([dateStr, total]) => ({
        name: getDayName(parseISO(dateStr)),
        total: total,
    }));

    return NextResponse.json(chartData);

  } catch (error) {
    console.error("[COMPLEX_FINANCIALS_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
