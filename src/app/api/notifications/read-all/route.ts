import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, String(session.user.id)), eq(notifications.isRead, false)))
      .returning({ id: notifications.id });

    return NextResponse.json({ success: true, data: { updatedCount: updated.length } });
  } catch (error) {
    console.error('[PATCH /api/notifications/read-all]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
