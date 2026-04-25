import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { concernReplies, concerns, users } from '@/db/schema';
import { createNotifications } from '@/lib/notifications';

const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const concernRows = await db
      .select({
        id: concerns.id,
        title: concerns.title,
        description: concerns.description,
        createdBy: concerns.createdBy,
        targetType: concerns.targetType,
        targetUserId: concerns.targetUserId,
        status: concerns.status,
        createdAt: concerns.createdAt,
        updatedAt: concerns.updatedAt,
        creatorName: users.name,
      })
      .from(concerns)
      .innerJoin(users, eq(concerns.createdBy, users.id))
      .where(and(eq(concerns.id, params.id), visibility))
      .limit(1);

    if (!concernRows.length) {
      return NextResponse.json({ success: false, error: 'Concern not found' }, { status: 404 });
    }

    const replyAuthor = users;
    const replies = await db
      .select({
        id: concernReplies.id,
        concernId: concernReplies.concernId,
        authorId: concernReplies.authorId,
        authorName: replyAuthor.name,
        authorRole: replyAuthor.role,
        message: concernReplies.message,
        createdAt: concernReplies.createdAt,
      })
      .from(concernReplies)
      .innerJoin(replyAuthor, eq(concernReplies.authorId, replyAuthor.id))
      .where(eq(concernReplies.concernId, params.id))
      .orderBy(asc(concernReplies.createdAt));

    return NextResponse.json({ success: true, data: { ...concernRows[0], replies } });
  } catch (error) {
    console.error('[GET /api/concerns/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = String(session.user.role).toUpperCase();
    if (role !== 'FACULTY' && role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only faculty or admin can update concern status' }, { status: 403 });
    }

    const userId = String(session.user.id);
    const visibility = buildVisibilityCondition(userId, role);
    if (!visibility) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const status = typeof body.status === 'string' ? body.status.toUpperCase() : '';

    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const existing = await db
      .select({ id: concerns.id, createdBy: concerns.createdBy, title: concerns.title })
      .from(concerns)
      .where(and(eq(concerns.id, params.id), visibility))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: 'Concern not found' }, { status: 404 });
    }

    const updated = await db
      .update(concerns)
      .set({
        status: status as (typeof STATUSES)[number],
        updatedAt: new Date(),
      })
      .where(eq(concerns.id, params.id))
      .returning();

    await createNotifications([
      {
        userId: existing[0].createdBy,
        type: 'CONCERN_STATUS_UPDATED',
        title: 'Concern Status Updated',
        message: `${existing[0].title} is now marked as ${status.replace('_', ' ')}.`,
        metadata: {
          concernId: params.id,
          href: '/student/concerns',
        },
      },
    ]);

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[PATCH /api/concerns/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
