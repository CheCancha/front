import { NextResponse, NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { BookingStatus } from "@prisma/client";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return new NextResponse("Faltan los parámetros de fecha.", {
        status: 400,
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: id },
        status: {
          in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO],
        },
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        depositPaid: true,
        date: true,
      },
    });

    let formattedData: { name: string; total: number }[] = [];

    const differenceInDays =
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

    if (differenceInDays < 32) {
      const days = eachDayOfInterval({ start, end });
      const dailyIncome: { [key: string]: number } = {};

      for (const booking of bookings) {
        const dayKey = format(booking.date, "dd/MM");
        dailyIncome[dayKey] = (dailyIncome[dayKey] || 0) + booking.depositPaid;
      }

      formattedData = days.map((day) => {
        const dayKey = format(day, "dd/MM");
        return {
          name: format(day, "d MMM", { locale: es }),
          total: dailyIncome[dayKey] || 0,
        };
      });
    } else {
      const months = eachMonthOfInterval({ start, end });
      const monthlyIncome: { [key: string]: number } = {};

      for (const booking of bookings) {
        const monthKey = format(booking.date, "yyyy-MM");
        monthlyIncome[monthKey] =
          (monthlyIncome[monthKey] || 0) + booking.depositPaid;
      }

      formattedData = months.map((month) => {
        const monthKey = format(month, "yyyy-MM");
        return {
          name: format(month, "MMM", { locale: es }),
          total: monthlyIncome[monthKey] || 0,
        };
      });
    }

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("[FINANCIALS_GET]", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}