import { NextResponse, NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { TransactionType, BookingStatus, TransactionSource, PaymentMethod } from "@prisma/client";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

// (Función de GET)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
   const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const complexId = (await context.params).id;
    const { searchParams } = new URL(req.url);

    // 1. OBTENER RANGO DE FECHAS (Sin cambios)
   const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    if (!startDateStr || !endDateStr) {
      return new NextResponse("Faltan los parámetros de fecha.", { status: 400 });
    }
    const start = startOfDay(parseISO(startDateStr));
    const end = endOfDay(parseISO(endDateStr));

    // 2. CONSULTAR TRANSACCIONES CON DATOS DE RESERVA
    const allTransactions = await db.transaction.findMany({
      where: {
        complexId: complexId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        bookingPlayer: {
          include: {
            booking: {
              select: {
                status: true, // Necesitamos el estado para filtrar
              },
            },
          },
        },
        // (Aquí incluiríamos 'sale' si tuviéramos ventas de cantina)
        // sale: { select: { status: true } }
      },
    });

    // 3. FILTRAR TRANSACCIONES CANCELADAS
    // const validTransactions = allTransactions.filter((tx) => {
      // Si la transacción es de una reserva (tiene bookingPlayer)
      // if (
      //   tx.source === "RESERVA" &&
      //   tx.bookingPlayer &&
      //   tx.bookingPlayer.booking
      // ) {
      //   // La contamos SOLO si la reserva NO está cancelada
      //   return tx.bookingPlayer.booking.status !== BookingStatus.CANCELADO;
      // }

      // Si es un GASTO o VENTA_PRODUCTO, siempre la contamos
      // (A menos que implementemos devoluciones de productos)
    //   return true;
    // });

    // --- 4. CALCULAR KPIS (usando 'validTransactions') ---
    const kpis: { ingresos: number; egresos: number; neto: number } = {
      ingresos: 0,
      egresos: 0,
      neto: 0,
    };

    const byPaymentMethodMap = new Map<string, number>();
    const bySourceMap = new Map<
      string,
      { total: number; type: TransactionType }
    >();

    // Iteramos sobre las transacciones VÁLIDAS
    for (const tx of allTransactions) {
      if (tx.type === TransactionType.INGRESO) {
        kpis.ingresos += tx.amount;

        // Sumar por Método de Pago (solo para ingresos)
        const currentPaymentTotal =
          byPaymentMethodMap.get(tx.paymentMethod) || 0;
        byPaymentMethodMap.set(
          tx.paymentMethod,
          currentPaymentTotal + tx.amount
        );
      } else if (tx.type === TransactionType.EGRESO) {
        kpis.egresos += tx.amount;
      }

      // Sumar por Fuente (Ingresos y Egresos)
      const currentSourceTotal = bySourceMap.get(tx.source)?.total || 0;
      bySourceMap.set(tx.source, {
        total: currentSourceTotal + tx.amount,
        type: tx.type,
      });
    }
    kpis.neto = kpis.ingresos - kpis.egresos;

    // Formatear para el frontend
    const byPaymentMethod = Array.from(byPaymentMethodMap.entries()).map(
      ([name, total]) => ({ name, total })
    );
    const bySource = Array.from(bySourceMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      type: data.type,
    }));

    const recentTransactions = allTransactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50)
      .map((tx) => ({
        id: tx.id,
        createdAt: tx.createdAt.toISOString(),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        paymentMethod: tx.paymentMethod,
        source: tx.source,
        status:
          tx.bookingPlayer?.booking?.status ||
          (tx.type === TransactionType.EGRESO ? "EGRESO" : "INGRESO"),
      }));

    return NextResponse.json({
      kpis,
      byPaymentMethod,
      bySource,
      recentTransactions,
    });
  } catch (error) {
    console.error("[FINANCIALS_SUMMARY_GET]", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}


export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "MANAGER") {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const complexId = (await context.params).id;
    const body = await req.json();

    const {
      amount,
      type, // INGRESO o EGRESO
      source, // GASTO, DEVOLUCION, OTRO, etc.
      paymentMethod,
      description,
    } = body;

    if (
      !amount ||
      !type ||
      !source ||
      !paymentMethod ||
      !description
    ) {
      return new NextResponse("Faltan datos obligatorios.", { status: 400 });
    }

    if (amount <= 0) {
      return new NextResponse("El monto debe ser un número positivo.", {
        status: 400,
      });
    }
    
    if (type === TransactionType.EGRESO && source === TransactionSource.RESERVA) {
       return new NextResponse("Las devoluciones de reservas deben hacerse desde el módulo de reservas.", { status: 400 });
    }

    const newTransaction = await db.transaction.create({
      data: {
        complexId: complexId,
        amount: Number(amount),
        type: type as TransactionType,
        source: source as TransactionSource,
        paymentMethod: paymentMethod as PaymentMethod,
        description: description,
        // No se vincula a un bookingPlayer o sale, es manual
      },
    });

    return NextResponse.json(newTransaction, { status: 201 });

  } catch (error) {
    console.error("[FINANCIALS_POST]", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}