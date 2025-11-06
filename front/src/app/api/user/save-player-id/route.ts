import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from '@/shared/lib/db';

export async function POST(request: Request) {

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.error("🚨 [API /save-player-id] Error: No autorizado. La sesión no fue encontrada o no tiene ID de usuario.");
    return new Response('Unauthorized', { status: 401 });
  }


  try {
    const body = await request.json();
    const { playerId }: { playerId: string | null } = body;


    if (typeof playerId === 'undefined') {
      console.warn("⚠️ [API /save-player-id] Advertencia: El Player ID no está definido en el cuerpo de la petición.");
      return new NextResponse('Player ID is missing', { status: 400 });
    }
    
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        oneSignalPlayerId: playerId,
      },
    });


    return NextResponse.json({ success: true });

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}