// front/src/app/api/user/save-player-id/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"; // Revisa que esta ruta sea correcta
import { db } from '@/shared/lib/db';

export async function POST(request: Request) {
  console.log("➡️ [API /save-player-id] Petición POST recibida.");

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.error("🚨 [API /save-player-id] Error: No autorizado. La sesión no fue encontrada o no tiene ID de usuario.");
    return new Response('Unauthorized', { status: 401 });
  }

  console.log(`👤 [API /save-player-id] Sesión encontrada para el usuario ID: ${session.user.id}`);

  try {
    const body = await request.json();
    const { playerId }: { playerId: string | null } = body;

    console.log(`📲 [API /save-player-id] Player ID recibido del frontend: ${playerId}`);

    if (typeof playerId === 'undefined') {
      console.warn("⚠️ [API /save-player-id] Advertencia: El Player ID no está definido en el cuerpo de la petición.");
      return new NextResponse('Player ID is missing', { status: 400 });
    }
    
    console.log(`🔄 [API /save-player-id] Actualizando la base de datos para el usuario ${session.user.id} con el Player ID: ${playerId}`);

    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        oneSignalPlayerId: playerId,
      },
    });

    console.log("✅ [API /save-player-id] Base de datos actualizada con éxito.");

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ [API /save-player-id] Error catastrófico durante el proceso:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}