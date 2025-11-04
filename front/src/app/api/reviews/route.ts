import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/shared/lib/db";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";

// --- 1. Esquema de Validación con Zod ---
const postReviewSchema = z.object({
  bookingId: z.string().min(1, "El ID de la reserva es requerido."),
  complexId: z.string().min(1, "El ID del complejo es requerido."),
  rating: z.number().int().min(1, "La calificación debe ser entre 1 y 5.").max(5, "La calificación debe ser entre 1 y 5."),
  comment: z.string().max(500, "El comentario no puede exceder los 500 caracteres.").optional(),
});

export async function POST(req: Request) {
  // --- LOG AÑADIDO: Capturamos el cuerpo primero para poder loguearlo en caso de error ---
  const body = await req.json();

  try {
    // --- 2. Autenticación de Usuario ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[REVIEWS_POST] Error de autenticación: No hay sesión de usuario.");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    // --- 3. Validación de la Entrada ---
    const validation = postReviewSchema.safeParse(body);
    if (!validation.success) {
      // --- LOG AÑADIDO: Mostramos el error exacto de Zod ---
      return NextResponse.json({ error: "Datos inválidos", issues: validation.error.issues }, { status: 400 });
    }
    const { bookingId, complexId, rating, comment } = validation.data;

    // --- 4. Verificación de Permisos y Estado ---
    const bookingToReview = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!bookingToReview) {
      console.error(`[REVIEWS_POST] Error: Reserva no encontrada con ID: ${bookingId}`);
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }
    if (bookingToReview.userId !== userId) {
      console.error(`[REVIEWS_POST] Error de permiso: Usuario ${userId} intentó calificar reserva de ${bookingToReview.userId}.`);
      return NextResponse.json({ error: "No tenés permiso para calificar esta reserva." }, { status: 403 });
    }
    if (bookingToReview.status !== BookingStatus.COMPLETADO) {
      console.error(`[REVIEWS_POST] Error de estado: La reserva no está 'COMPLETADO' (estado actual: ${bookingToReview.status}).`);
      return NextResponse.json({ error: "Solo podés calificar reservas que ya se jugaron." }, { status: 400 });
    }
    if (bookingToReview.hasReview) {
      console.error(`[REVIEWS_POST] Error de duplicado: La reserva ${bookingId} ya tiene una calificación.`);
      return NextResponse.json({ error: "Esta reserva ya fue calificada anteriormente." }, { status: 409 });
    }

    // --- 5. Transacción en la Base de Datos ---
    const newReview = await db.$transaction(async (prisma) => {
      // a) Crear la nueva reseña
      const review = await prisma.review.create({
        data: { rating, comment, userId, complexId, bookingId },
      });

      // b) Marcar la reserva como que ya tiene una reseña
      await prisma.booking.update({
        where: { id: bookingId },
        data: { hasReview: true },
      });

      // c) Recalcular el puntaje promedio y el contador de reseñas del complejo
      const stats = await prisma.review.aggregate({
        where: { complexId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.complex.update({
        where: { id: complexId },
        data: { averageRating: stats._avg.rating || 0, reviewCount: stats._count.id },
      });

      return review;
    });

    // --- 6. Respuesta Exitosa ---
    return NextResponse.json(newReview, { status: 201 });

  } catch (error) {
    console.error("--- [REVIEWS_POST] ¡ERROR FATAL! ---", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

