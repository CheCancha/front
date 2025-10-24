import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/shared/lib/auth";
import { db } from '@/shared/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const body = await req.json();
  const notification = await db.notification.create({
    data: {
      userId: session.user.id,
      title: body.title,
      message: body.message,
      url: body.url,
      isRead: false,
      createdAt: new Date(),
    },
  });

  return NextResponse.json(notification);
}