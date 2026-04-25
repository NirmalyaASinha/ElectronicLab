import { NextRequest, NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { concernReplies, concerns, users } from '@/db/schema';
import { concernsHrefForRole, createNotifications } from '@/lib/notifications';

function buildVisibilityCondition(userId: string, role: string) {
  if (role === 'STUDENT') {
    return eq(concerns.createdBy, userId);
  }

  if (role === 'FACULTY') {
    return or(
      eq(concerns.targetType, 'ALL_FACULTY'),
      and(eq(concerns.targetType, 'FACULTY'), eq(concerns.targetUserId, userId))
    );
  }

  if (role === 'ADMIN') {
    return eq(concerns.targetType, 'ADMIN');
  }

  return null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = String(session.user.role).toUpperCase();
    const userId = String(session.user.id);
    const visibility = buildVisibilityCondition(userId, role);
    if (!visibility) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const visibleConcern = await db
      .select({
        id: concerns.id,
        createdBy: concerns.createdBy,
        targetType: concerns.targetType,
        targetUserId: concerns.targetUserId,
        title: concerns.title,
      })
      .from(concerns)
      .where(and(eq(concerns.id, params.id), visibility))
      .limit(1);

    if (!visibleConcern.length) {
      return NextResponse.json({ success: false, error: 'Concern not found' }, { status: 404 });
    }

    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message || message.length > 5000) {
      return NextResponse.json({ success: false, error: 'Message is required and must be 5000 characters or fewer' }, { status: 400 });
    }

    const inserted = await db
      .insert(concernReplies)
      .values({
        concernId: params.id,
        authorId: userId,
        message,
      })
      .returning();

    await db
      .update(concerns)
      .set({ updatedAt: new Date() })
      .where(eq(concerns.id, params.id));

    const concern = visibleConcern[0];
    let recipients: Array<{ id: string; role: string }> = [];

    if (role === 'STUDENT') {
      if (concern.targetType === 'FACULTY' && concern.targetUserId) {
        recipients = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, concern.targetUserId)).limit(1);
      } else if (concern.targetType === 'ALL_FACULTY') {
        recipients = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.role, 'FACULTY'));
      } else if (concern.targetType === 'ADMIN') {
        recipients = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.role, 'ADMIN'));
      }
    } else {
      recipients = [{ id: concern.createdBy, role: 'STUDENT' }];
    }

    await createNotifications(
      recipients
        .filter((recipient) => recipient.id !== userId)
        .map((recipient) => ({
          userId: recipient.id,
          type: 'CONCERN_REPLIED' as const,
          title: 'New Concern Reply',
          message: `${concern.title} has a new reply.`,
          metadata: {
            concernId: params.id,
            href: concernsHrefForRole(String(recipient.role)),
          },
        }))
    );

    return NextResponse.json({ success: true, data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/concerns/:id/replies]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
