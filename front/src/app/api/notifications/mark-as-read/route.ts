import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/shared/lib/auth";
import { db } from '@/shared/lib/db';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ success: true });
}