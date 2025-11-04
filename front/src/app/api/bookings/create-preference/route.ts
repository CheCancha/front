import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { getMercadoPagoPreferenceClient } from "@/shared/lib/mercadopago";
import { endOfDay, format, startOfDay } from "date-fns";
import { toDate } from "date-fns-tz";
import {
  Booking,
  BookingStatus,
  Court,
  Coupon,
  PaymentMethod,
} from "@prisma/client";
import SimpleCrypto from "simple-crypto-js";
import { z } from "zod";

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

// --- 1. Esquema de Validación con Zod---
const createBookingSchema = z.object({
  complexId: z.string().min(1),
  courtId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "El formato de fecha debe ser YYYY-MM-DD",
  }),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  price: z.number().min(0),
  depositAmount: z.number().min(0),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

type BookingRequest = z.infer<typeof createBookingSchema>;

function getMercadoPagoCredentials(complex: {
  mp_access_token: string | null;
  mp_public_key: string | null;
}) {
  if (complex.mp_access_token && complex.mp_public_key) {
    console.log("Usando credenciales de producción del complejo.");
    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) throw new Error("ENCRYPTION_KEY no está definida.");

    const crypto = new SimpleCrypto(secretKey);
    const accessToken = crypto.decrypt(complex.mp_access_token) as string;

    return { accessToken, publicKey: complex.mp_public_key };
  }

  console.log("Usando credenciales de prueba (fallback).");
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  if (!accessToken || !publicKey) {
    throw new Error(
      "El complejo no tiene Mercado Pago configurado y no hay credenciales de prueba."
    );
  }

  return { accessToken, publicKey };
}

function normalizeHourString(hourStr: string): {
  dateShift: number;
  formatted: string;
} {
  const [h, m] = hourStr.split(":").map(Number);
  if (h < 24) return { dateShift: 0, formatted: hourStr };

  const normalizedHours = h % 24;
  const daysToAdd = Math.floor(h / 24);

  return {
    dateShift: daysToAdd,
    formatted: `${String(normalizedHours).padStart(2, "0")}:${String(
      m
    ).padStart(2, "0")}`,
  };
}

// --- 2. Transacción de Base de Datos ---
async function createPendingBookingInTransaction(
  data: BookingRequest,
  userId: string | undefined,
  court: Court,
  coupon: Coupon | null
): Promise<Booking> {
  const { dateShift, formatted } = normalizeHourString(data.time);
  const bookingDate = toDate(`${data.date}T${formatted}:00`, {
    timeZone: ARGENTINA_TIME_ZONE,
  });

  // si cruzó la medianoche, sumamos un día
  if (dateShift > 0) bookingDate.setDate(bookingDate.getDate() + dateShift);
  const startOfBookingDay = startOfDay(bookingDate);
  const endOfBookingDay = endOfDay(bookingDate);

  return db.$transaction(async (prisma) => {
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        courtId: data.courtId,
        date: {
          gte: startOfBookingDay,
          lt: endOfBookingDay,
        },
        status: { in: [BookingStatus.CONFIRMADO, BookingStatus.PENDIENTE] },
      },
      include: { court: { select: { slotDurationMinutes: true } } },
    });

    const [hour, minute] = data.time.split(":").map(Number);
    const requestedStartMinutes = hour * 60 + minute;
    const requestedEndMinutes =
      requestedStartMinutes + court.slotDurationMinutes;

    const isConflict = conflictingBookings.some((booking) => {
      const existingStartMinutes =
        booking.startTime * 60 + (booking.startMinute || 0);
      const existingEndMinutes =
        existingStartMinutes + booking.court.slotDurationMinutes;
      return (
        requestedStartMinutes < existingEndMinutes &&
        requestedEndMinutes > existingStartMinutes
      );
    });

    if (isConflict) {
      throw new Error("Lo sentimos, este horario ya no está disponible.");
    }

    if (coupon) {
      const freshCoupon = await prisma.coupon.findUnique({
        where: { id: coupon.id },
      });

      if (
        !freshCoupon ||
        !freshCoupon.isActive ||
        (freshCoupon.maxUses != null && freshCoupon.uses >= freshCoupon.maxUses)
      ) {
        throw new Error(
          "El cupón ya no es válido o ha alcanzado su límite de usos."
        );
      }

      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { uses: { increment: 1 } },
      });
    }

    return prisma.booking.create({
      data: {
        courtId: data.courtId,
        date: bookingDate,
        startTime: parseInt(data.time.split(":")[0]),
        startMinute: parseInt(data.time.split(":")[1]),
        totalPrice: data.price,
        depositAmount: data.depositAmount,
        depositPaid: 0,
        remainingBalance: data.price,
        status: BookingStatus.PENDIENTE,
        couponId: coupon?.id,
        paymentMethod: data.paymentMethod || null,
        ...(userId
          ? { userId: userId }
          : { guestName: data.guestName, guestPhone: data.guestPhone }),
      },
    });
  });
}

// --- 3. Handler ---
export async function POST(req: Request) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseURL) {
      console.error("Error Crítico: NEXT_PUBLIC_BASE_URL no está definida.");
      return new NextResponse("Error de configuración del servidor.", {
        status: 500,
      });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const body = await req.json();

    const bookingData = createBookingSchema.parse(body);

    if (!userId && !bookingData.guestName) {
      return new NextResponse("El nombre es requerido para los invitados", {
        status: 400,
      });
    }

    const complexData = await db.complex.findUnique({
      where: { id: bookingData.complexId },
      select: {
        name: true,
        mp_access_token: true,
        mp_public_key: true,
        courts: {
          where: { id: bookingData.courtId },
          include: { sport: true },
        },
      },
    });

    if (!complexData || complexData.courts.length === 0) {
      return new NextResponse(
        "El complejo o la cancha no fueron encontrados.",
        { status: 404 }
      );
    }
    const court = complexData.courts[0];

    // --- Se busca y valida el cupón antes de la transacción ---
    let validCoupon: Coupon | null = null;
    if (bookingData.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: bookingData.couponCode.toUpperCase(),
          complexId: bookingData.complexId,
          isActive: true,
        },
      });
      if (coupon) {
        const isExpired =
          coupon.validUntil && new Date(coupon.validUntil) < new Date();
        const hasUsesLeft =
          coupon.maxUses == null || coupon.uses < coupon.maxUses;
        if (!isExpired && hasUsesLeft) {
          validCoupon = coupon;
        }
      }
    }

    const pendingBooking = await createPendingBookingInTransaction(
      bookingData,
      userId,
      court,
      validCoupon
    );

    const { accessToken, publicKey } = getMercadoPagoCredentials(complexData);
    const preferenceClient = getMercadoPagoPreferenceClient(accessToken);

    const notificationUrl = `${baseURL}/api/webhooks/mercado-pago`;
    console.log(
      `[create-preference] URL de Notificación que se enviará a Mercado Pago: "${notificationUrl}"`
    );

    const formattedDateForMP = format(
      new Date(`${bookingData.date}T00:00:00`),
      "dd/MM/yyyy"
    );

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: bookingData.courtId,
            title: `Seña para ${court.sport.name} en ${complexData.name}`,
            description: `Turno para ${court.name} el ${formattedDateForMP} a las ${bookingData.time}hs`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: bookingData.depositAmount,
          },
        ],
        external_reference: pendingBooking.id,
        notification_url: notificationUrl,
        back_urls: {
          success: `${baseURL}/booking-status?status=success&booking_id=${pendingBooking.id}`,
          failure: `${baseURL}/booking-status?status=failure&booking_id=${pendingBooking.id}`,
          pending: `${baseURL}/booking-status?status=pending&booking_id=${pendingBooking.id}`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      preferenceId: preference.id,
      publicKey: publicKey,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ message: "Datos inválidos", issues: error.issues }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("horario ya no está disponible") ||
        error.message.includes("cupón"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Error en create-preference:", error);
    return new NextResponse("Error interno del servidor.", { status: 500 });
  }
}
