import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projectComponents, projectMembers, projects, users, components } from '@/db/schema';
import { createNotifications, projectHrefForRole } from '@/lib/notifications';

async function loadProjectContext(projectId: string) {
  const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!projectRows.length) return null;

  const project = projectRows[0];
  const ownerRows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, project.ownerId)).limit(1);
  const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));

  const memberUserIds = memberRows.map((member) => member.userId);
  const memberUsers = memberUserIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(inArray(users.id, memberUserIds))
    : [];
  const memberUserMap = new Map(memberUsers.map((row) => [row.id, row]));

  const componentRows = await db.select().from(projectComponents).where(eq(projectComponents.projectId, projectId));
  const componentIds = componentRows.map((entry) => entry.componentId);
  const componentMetaRows = componentIds.length
    ? await db.select({ id: components.id, name: components.name, category: components.category }).from(components).where(inArray(components.id, componentIds))
    : [];
  const componentMap = new Map(componentMetaRows.map((row) => [row.id, row]));

  return {
    project,
    owner: ownerRows[0] || null,
    members: memberRows.map((member) => ({
      ...member,
      user: memberUserMap.get(member.userId) || null,
    })),
    components: componentRows.map((entry) => ({
      ...entry,
      component: componentMap.get(entry.componentId) || null,
    })),
  };
}

function canViewProject(role: string, userId: string, project: { ownerId: string; visibility: string }, membershipRows: Array<{ userId: string }>) {
  if (role === 'ADMIN' || role === 'FACULTY') return true;
  if (project.ownerId === userId) return true;
  if (project.visibility === 'OPEN') return true;
  return membershipRows.some((member) => member.userId === userId);
}

function canManageProject(role: string, userId: string, project: { ownerId: string }) {
  return role === 'ADMIN' || project.ownerId === userId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const context = await loadProjectContext(params.id);
    if (!context) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const userId = String(session.user.id);
    const role = String(session.user.role).toUpperCase();
    if (!canViewProject(role, userId, context.project, context.members)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...context.project,
        owner: context.owner,
        members: context.members,
        components: context.components,
        isOwner: context.project.ownerId === userId,
        isMember: context.members.some((member) => member.userId === userId),
        canEdit: canManageProject(role, userId, context.project),
        canJoin: role === 'STUDENT' && context.project.visibility === 'OPEN' && context.project.ownerId !== userId && !context.members.some((member) => member.userId === userId),
      },
    });
  } catch (error) {
    console.error('[GET /api/projects/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const context = await loadProjectContext(params.id);
    if (!context) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const userId = String(session.user.id);
    const role = String(session.user.role).toUpperCase();
    if (!canManageProject(role, userId, context.project)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const patch: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.description === 'string') patch.description = body.description.trim();
    if (body.visibility === 'PRIVATE' || body.visibility === 'OPEN') patch.visibility = body.visibility;
    if (body.status === 'PLANNING' || body.status === 'ACTIVE' || body.status === 'ON_HOLD' || body.status === 'COMPLETED') patch.status = body.status;
    if (body.progress !== undefined) patch.progress = Math.max(0, Math.min(100, Number(body.progress) || 0));

    const updated = await db.update(projects).set(patch).where(eq(projects.id, params.id)).returning();

    const notifyMembers = context.members.filter((member) => member.userId !== userId);
    await createNotifications(
      notifyMembers.map((member) => ({
        userId: member.userId,
        type: 'PROJECT_UPDATED' as const,
        title: 'Project Updated',
        message: `${context.project.name} has new updates.`,
        metadata: {
          projectId: params.id,
          href: projectHrefForRole(String(member.user?.role || 'STUDENT'), params.id),
        },
      }))
    );

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[PATCH /api/projects/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    if (!canManageProject(role, String(session.user.id), project)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(projects).where(eq(projects.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
