import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projectMembers, projects, users } from '@/db/schema';
import { createNotifications, projectHrefForRole } from '@/lib/notifications';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const projectRows = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
    if (!projectRows.length) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const project = projectRows[0];
    const role = String(session.user.role).toUpperCase();
    const currentUserId = String(session.user.id);

    const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, params.id));
    const canView = role === 'ADMIN' || role === 'FACULTY' || project.ownerId === currentUserId || project.visibility === 'OPEN' || memberRows.some((member) => member.userId === currentUserId);
    if (!canView) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const userIds = memberRows.map((member) => member.userId);
    const memberUsers = userIds.length
      ? await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(inArray(users.id, userIds))
      : [];
    const userMap = new Map(memberUsers.map((row) => [row.id, row]));

    return NextResponse.json({
      success: true,
      data: memberRows.map((member) => ({
        ...member,
        user: userMap.get(member.userId) || null,
      })),
    });
  } catch (error) {
    console.error('[GET /api/projects/:id/members]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const projectRows = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
    if (!projectRows.length) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const project = projectRows[0];
    const role = String(session.user.role).toUpperCase();
    const currentUserId = String(session.user.id);
    const body = await req.json().catch(() => ({}));
    const targetUserId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : currentUserId;
    const targetRole = body.role === 'OWNER' ? 'OWNER' : 'MEMBER';
    const selfJoin = targetUserId === currentUserId;

    const canManage = role === 'ADMIN' || project.ownerId === currentUserId;
    if (!selfJoin && !canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (selfJoin && role === 'STUDENT' && project.visibility !== 'OPEN' && project.ownerId !== currentUserId) {
      return NextResponse.json({ success: false, error: 'Only open projects can be joined directly' }, { status: 403 });
    }

    const memberExists = await db
      .select({ id: projectMembers.id, userId: projectMembers.userId })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, params.id));

    if (memberExists.some((member) => member.userId === targetUserId)) {
      return NextResponse.json({ success: false, error: 'User is already a member' }, { status: 409 });
    }

    const targetUserRows = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUserRows.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const inserted = await db
      .insert(projectMembers)
      .values({
        projectId: params.id,
        userId: targetUserId,
        role: selfJoin ? 'MEMBER' : targetRole,
      })
      .returning();

    const recipientRows = await db
      .select({ id: users.id, role: users.role, name: users.name })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);
    const recipient = recipientRows[0];

    const payloads = [];
    if (selfJoin && project.ownerId !== currentUserId) {
      const ownerRows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, project.ownerId)).limit(1);
      const owner = ownerRows[0];
      if (owner) {
        payloads.push({
          userId: owner.id,
          type: 'PROJECT_JOINED' as const,
          title: 'Project Joined',
          message: `${recipient?.name || 'A student'} joined ${project.name}.`,
          metadata: {
            projectId: params.id,
            href: projectHrefForRole(String(owner.role), params.id),
          },
        });
      }
    }

    if (!selfJoin && recipient) {
      payloads.push({
        userId: recipient.id,
        type: 'PROJECT_MEMBER_ADDED' as const,
        title: 'Added to Project',
        message: `You were added to ${project.name}.`,
        metadata: {
          projectId: params.id,
          href: projectHrefForRole(String(recipient.role), params.id),
        },
      });
    }

    await createNotifications(payloads);

    return NextResponse.json({ success: true, data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects/:id/members]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
