import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { startOfDay, endOfDay } from "date-fns";
import { BookingStatus } from "@prisma/client";

// --- GET ---
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 GET /api/complex/[id]/bookings - Iniciando");

  try {
    const { id } = await params;
    console.log("📍 Complex ID:", id);

    // Log de sesión
    console.log("🔍 Verificando sesión...");
    const session = await getServerSession(authOptions);
    console.log("👤 Sesión obtenida:", {
      userId: session?.user?.id || "No ID",
      role: session?.user?.role || "No role",
      hasSession: !!session,
    });

    if (!session?.user?.id || session.user.role !== "MANAGER") {
      console.log("❌ Autorización fallida");
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Log de parámetros de búsqueda
    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("date");
    console.log("📅 Parámetro de fecha:", dateString);

    if (!dateString) {
      console.log("❌ Falta parámetro date");
      return new NextResponse("El parámetro 'date' es obligatorio", {
        status: 400,
      });
    }

    // Log de procesamiento de fecha
    const requestedDate = new Date(`${dateString}T00:00:00`);
    const startOfRequestedDay = startOfDay(requestedDate);
    const endOfRequestedDay = endOfDay(requestedDate);

    console.log("📅 Fechas procesadas:", {
      original: dateString,
      parsed: requestedDate.toISOString(),
      startOfDay: startOfRequestedDay.toISOString(),
      endOfDay: endOfRequestedDay.toISOString(),
    });

    // Log de consulta a BD
    console.log("💾 Consultando reservas en BD...");
    const bookings = await db.booking.findMany({
      where: {
        court: { complexId: id },
        date: {
          gte: startOfRequestedDay,
          lte: endOfRequestedDay,
        },
      },
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    console.log("✅ Reservas encontradas:", bookings.length);
    console.log(
      "📝 Primera reserva (si existe):",
      bookings[0]
        ? {
            id: bookings[0].id,
            courtName: bookings[0].court.name,
            guestName: bookings[0].guestName,
            date: bookings[0].date.toISOString(),
          }
        : "No hay reservas"
    );

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("💥 ERROR en GET:", error);
    console.error(
      "📋 Stack trace:",
      error instanceof Error ? error.stack : "No stack"
    );
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// --- POST ---
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 POST /api/complex/[id]/bookings - Iniciando");

  try {
    const { id: _id } = await params;
    console.log("📍 Complex ID:", _id);

    // Log de sesión
    console.log("🔍 Verificando sesión...");
    const session = await getServerSession(authOptions);
    console.log("👤 Sesión obtenida:", {
      userId: session?.user?.id || "No ID",
      role: session?.user?.role || "No role",
    });

    if (!session?.user?.id || session.user.role !== "MANAGER") {
      console.log("❌ Autorización fallida");
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Log del cuerpo de la petición
    console.log("📦 Leyendo body...");
    const body = await req.json();
    console.log("📝 Body recibido:", body);

    const { courtId, guestName, date, time, status, depositPaid } = body;
    console.log("🔍 Datos extraídos:", {
      courtId,
      guestName,
      date,
      time,
      status,
      depositPaid,
    });

    if (!courtId || !guestName || !date || !time) {
      console.log("❌ Faltan datos obligatorios");
      return new NextResponse("Faltan datos para crear la reserva", {
        status: 400,
      });
    }

    // Log de procesamiento de tiempo
    console.log("⏰ Procesando tiempo...");
    const [hour, minute] = time.split(":").map(Number);
    console.log("🕐 Tiempo parseado:", { hour, minute });

    // Log de búsqueda de cancha
    console.log("🏟️ Buscando cancha...");
    const court = await db.court.findUnique({
      where: { id: courtId },
      include: { priceRules: true },
    });

    console.log(
      "🏟️ Cancha encontrada:",
      court
        ? {
            id: court.id,
            name: court.name,
            slotDurationMinutes: court.slotDurationMinutes,
            priceRulesCount: court.priceRules.length,
          }
        : "No encontrada"
    );

    if (!court) {
      console.log("❌ Cancha no encontrada");
      return new NextResponse("Cancha no encontrada", { status: 404 });
    }

    // Log de regla de precio
    console.log("💰 Buscando regla de precio aplicable...");
    const applicableRule = court.priceRules.find(
      (rule) => hour >= rule.startTime && hour < rule.endTime
    );

    console.log(
      "💰 Regla aplicable:",
      applicableRule
        ? {
            id: applicableRule.id,
            startTime: applicableRule.startTime,
            endTime: applicableRule.endTime,
            price: applicableRule.price,
          }
        : "No encontrada"
    );

    if (!applicableRule) {
      console.log("❌ No hay precio configurado para este horario");
      return new NextResponse(
        `No hay un precio configurado para las ${time} hs. en esta cancha.`,
        { status: 400 }
      );
    }

    // Log de procesamiento de fecha y cálculo de minutos
    const bookingDate = new Date(`${date}T00:00:00`);
    const newBookingStartMinutes = hour * 60 + minute;
    const newBookingEndMinutes =
      newBookingStartMinutes + court.slotDurationMinutes;

    console.log("📅 Datos de reserva calculados:", {
      bookingDate: bookingDate.toISOString(),
      newBookingStartMinutes,
      newBookingEndMinutes,
      duration: court.slotDurationMinutes,
    });

    // Log de búsqueda de reservas existentes
    console.log("🔍 Buscando reservas existentes...");
    const existingBookings = await db.booking.findMany({
      where: {
        courtId,
        date: bookingDate,
        status: { not: "CANCELADO" },
      },
      include: {
        court: { select: { slotDurationMinutes: true } },
      },
    });

    console.log("📋 Reservas existentes encontradas:", existingBookings.length);
    existingBookings.forEach((booking, index) => {
      console.log(`📝 Reserva ${index + 1}:`, {
        id: booking.id,
        startTime: booking.startTime,
        startMinute: booking.startMinute,
        status: booking.status,
      });
    });

    // Log de verificación de superposición
    console.log("⚠️ Verificando superposiciones...");
    const isOverlapping = existingBookings.some((existingBooking) => {
      const existingStartMinutes =
        existingBooking.startTime * 60 + (existingBooking.startMinute || 0);
      const existingEndMinutes =
        existingStartMinutes + existingBooking.court.slotDurationMinutes;

      const overlaps =
        newBookingStartMinutes < existingEndMinutes &&
        newBookingEndMinutes > existingStartMinutes;

      console.log(`🔍 Comparando con reserva ${existingBooking.id}:`, {
        existing: `${existingStartMinutes}-${existingEndMinutes}`,
        new: `${newBookingStartMinutes}-${newBookingEndMinutes}`,
        overlaps,
      });

      return overlaps;
    });

    console.log("⚠️ ¿Hay superposición?", isOverlapping);

    if (isOverlapping) {
      console.log("❌ Horario ocupado");
      return new NextResponse(
        "El horario para esta cancha ya está ocupado o se superpone con otra reserva.",
        { status: 409 }
      );
    }

    // Log de cálculos finales
    const totalPrice = applicableRule.price;
    const depositAmount = depositPaid || 0;

    console.log("💰 Cálculos finales:", {
      totalPrice,
      depositAmount,
      remainingBalance: totalPrice - depositAmount,
    });

    // Log de creación de reserva
    console.log("💾 Creando nueva reserva...");
    const newBooking = await db.booking.create({
      data: {
        courtId,
        guestName,
        date: bookingDate,
        startTime: hour,
        startMinute: minute,
        totalPrice,
        depositAmount,
        depositPaid,
        remainingBalance: totalPrice - depositAmount,
        status: (status || "PENDIENTE") as BookingStatus,
      },
    });

    console.log("✅ Reserva creada:", newBooking.id);

    // Log de búsqueda final con datos de cancha
    console.log("🔍 Obteniendo reserva con datos de cancha...");
    const bookingWithCourt = await db.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
      },
    });

    console.log("✅ POST completado exitosamente");
    return NextResponse.json(bookingWithCourt, { status: 201 });
  } catch (error) {
    console.error("💥 ERROR en POST:", error);
    console.error(
      "📋 Stack trace:",
      error instanceof Error ? error.stack : "No stack"
    );
    console.error(
      "🔍 Tipo de error:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// --- PATCH ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 PATCH /api/complex/[id]/bookings - Iniciando");

  try {
    const { id } = await params;
    console.log("📍 Complex ID:", id);

    // Log de sesión
    console.log("🔍 Verificando sesión...");
    const session = await getServerSession(authOptions);
    console.log("👤 Sesión obtenida:", {
      userId: session?.user?.id || "No ID",
      role: session?.user?.role || "No role",
    });

    if (!session?.user?.id || session.user.role !== "MANAGER") {
      console.log("❌ Autorización fallida");
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Log del cuerpo de la petición
    console.log("📦 Leyendo body...");
    const body = await req.json();
    console.log("📝 Body recibido:", body);

    const { bookingId, ...updateData } = body;
    console.log("🔍 Booking ID:", bookingId);
    console.log("📝 Datos a actualizar:", updateData);

    if (!bookingId) {
      console.log("❌ Falta ID de reserva");
      return new NextResponse("Falta el ID de la reserva", { status: 400 });
    }

    // Log de limpieza de datos
    delete updateData.courtId;
    delete updateData.time;
    delete updateData.date;
    delete updateData.totalPrice;
    console.log("🧹 Datos después de limpieza:", updateData);

    // Log de actualización
    console.log("💾 Actualizando reserva...");
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        court: {
          select: { id: true, name: true, slotDurationMinutes: true },
        },
      },
    });

    console.log("✅ Reserva actualizada:", updatedBooking.id);
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("💥 ERROR en PATCH:", error);
    console.error(
      "📋 Stack trace:",
      error instanceof Error ? error.stack : "No stack"
    );
    console.error(
      "🔍 Tipo de error:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
