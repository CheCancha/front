import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; 
    const date = req.nextUrl.searchParams.get("date");

    if (!date) {
      return new NextResponse("Falta el parámetro de fecha", { status: 400 });
    }

    const selectedDate = new Date(date);
    const startDate = startOfDay(selectedDate);
    const endDate = endOfDay(selectedDate);

    const bookings = await db.booking.findMany({
      where: {
        court: {
          complexId: id,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        courtId: true,
        startTime: true, 
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("[COMPLEX_AVAILABILITY_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
