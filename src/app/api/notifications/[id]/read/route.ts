import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, params.id), eq(notifications.userId, String(session.user.id))))
      .returning({ id: notifications.id, isRead: notifications.isRead });

    if (!updated.length) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[PATCH /api/notifications/:id/read]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
