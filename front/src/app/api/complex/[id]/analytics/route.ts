import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { parseISO } from "date-fns";
import { getAnalyticsData } from "@/app/features/dashboard/services/analytics.service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 2. Autenticación (Opcional pero recomendada)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 3. Obtener Parámetros
    const complexId = (await context.params).id;
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const courtIdsStr = searchParams.get("courtIds");

    if (!startDateStr || !endDateStr) {
      return new NextResponse("Faltan los parámetros de fecha (startDate/endDate).", {
        status: 400,
      });
    }

    // 4. Parsear Parámetros
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    const courtIds = courtIdsStr ? courtIdsStr.split(",") : undefined;

    // 5. Llamar al "Cerebro" (el Servicio)
    const data = await getAnalyticsData({
      complexId,
      startDate,
      endDate,
      courtIds,
    });

    // 6. Devolver los datos al cliente
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("[ANALYTICS_GET_API]", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}

