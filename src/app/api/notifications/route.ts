import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        metadata: notifications.metadata,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}