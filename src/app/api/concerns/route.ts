import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { concernReplies, concerns, users } from '@/db/schema';
import { concernsHrefForRole, createNotifications } from '@/lib/notifications';

const TARGET_TYPES = ['FACULTY', 'ALL_FACULTY', 'ADMIN'] as const;
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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = String(session.user.role).toUpperCase();
    const userId = String(session.user.id);
    const url = req.nextUrl;
    const status = (url.searchParams.get('status') || '').toUpperCase();
    const targetType = (url.searchParams.get('targetType') || '').toUpperCase();

    const visibility = buildVisibilityCondition(userId, role);
    if (!visibility) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const conditions: any[] = [visibility];
    if (STATUSES.includes(status as (typeof STATUSES)[number])) {
      conditions.push(eq(concerns.status, status as (typeof STATUSES)[number]));
    }

    if (TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number])) {
      conditions.push(eq(concerns.targetType, targetType as (typeof TARGET_TYPES)[number]));
    }

    const rows = await db
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
      .where(and(...conditions))
      .orderBy(desc(concerns.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/concerns]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || String(session.user.role).toUpperCase() !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Only students can raise concerns' }, { status: 403 });
    }

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const targetType = typeof body.targetType === 'string' ? body.targetType.toUpperCase() : '';
    const targetUserId = typeof body.targetUserId === 'string' && body.targetUserId.trim() ? body.targetUserId.trim() : null;

    if (!title || !description || !TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number])) {
      return NextResponse.json({ success: false, error: 'Title, description, and valid targetType are required' }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ success: false, error: 'Title must be 200 characters or fewer' }, { status: 400 });
    }

    if (description.length < 5 || description.length > 5000) {
      return NextResponse.json({ success: false, error: 'Description must be between 5 and 5000 characters' }, { status: 400 });
    }

    if (targetType === 'FACULTY') {
      if (!targetUserId) {
        return NextResponse.json({ success: false, error: 'Faculty target requires targetUserId' }, { status: 400 });
      }

      const faculty = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, targetUserId), eq(users.role, 'FACULTY')))
        .limit(1);

      if (!faculty.length) {
        return NextResponse.json({ success: false, error: 'Selected faculty not found' }, { status: 400 });
      }
    }

    if (targetType !== 'FACULTY' && targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId is only allowed for FACULTY concerns' }, { status: 400 });
    }

    const inserted = await db
      .insert(concerns)
      .values({
        title,
        description,
        createdBy: String(session.user.id),
        targetType: targetType as (typeof TARGET_TYPES)[number],
        targetUserId: targetType === 'FACULTY' ? targetUserId : null,
        status: 'OPEN',
      })
      .returning();

    const concern = inserted[0];
    let recipients: Array<{ id: string; role: string }> = [];

    if (targetType === 'FACULTY' && targetUserId) {
      const rows = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);
      recipients = rows;
    } else if (targetType === 'ALL_FACULTY') {
      recipients = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.role, 'FACULTY'));
    } else if (targetType === 'ADMIN') {
      recipients = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.role, 'ADMIN'));
    }

    await createNotifications(
      recipients.map((recipient) => ({
        userId: recipient.id,
        type: 'CONCERN_CREATED' as const,
        title: 'New Concern Raised',
        message: `${title} has been submitted for review.`,
        metadata: {
          concernId: concern.id,
          href: concernsHrefForRole(String(recipient.role)),
        },
      }))
    );

    return NextResponse.json({ success: true, data: concern }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/concerns]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
