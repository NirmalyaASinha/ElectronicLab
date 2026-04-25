import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { components, projectComponents, projectMembers, projects, users } from '@/db/schema';

async function canViewProject(projectId: string, userId: string, role: string) {
  const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!projectRows.length) return { allowed: false, project: null as any };

  const project = projectRows[0];
  if (role === 'ADMIN' || role === 'FACULTY' || project.ownerId === userId || project.visibility === 'OPEN') {
    return { allowed: true, project };
  }

  const memberRows = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  return { allowed: memberRows.length > 0, project };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const visibility = await canViewProject(params.id, String(session.user.id), String(session.user.role).toUpperCase());
    if (!visibility.project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }
    if (!visibility.allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const rows = await db.select().from(projectComponents).where(eq(projectComponents.projectId, params.id));
    const componentIds = rows.map((row) => row.componentId);
    const userIds = rows.map((row) => row.addedBy).filter(Boolean) as string[];
    const componentRows = componentIds.length
      ? await db.select({ id: components.id, name: components.name, category: components.category }).from(components).where(inArray(components.id, componentIds))
      : [];
    const userRows = userIds.length
      ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds))
      : [];
    const componentMap = new Map(componentRows.map((row) => [row.id, row]));
    const userMap = new Map(userRows.map((row) => [row.id, row]));

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        component: componentMap.get(row.componentId) || null,
        addedByUser: row.addedBy ? userMap.get(row.addedBy) || null : null,
      })),
    });
  } catch (error) {
    console.error('[GET /api/projects/:id/components]', error);
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
    if (role !== 'ADMIN' && project.ownerId !== String(session.user.id)) {
      return NextResponse.json({ success: false, error: 'Only owner or admin can add components' }, { status: 403 });
    }

    const body = await req.json();
    const componentId = typeof body.componentId === 'string' ? body.componentId.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null;
    const quantity = Math.max(1, Number(body.quantity) || 1);

    if (!componentId) {
      return NextResponse.json({ success: false, error: 'componentId is required' }, { status: 400 });
    }

    const inserted = await db
      .insert(projectComponents)
      .values({
        projectId: params.id,
        componentId,
        quantity,
        notes,
        addedBy: String(session.user.id),
      })
      .returning();

    return NextResponse.json({ success: true, data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects/:id/components]', error);
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
    if (role !== 'ADMIN' && project.ownerId !== String(session.user.id)) {
      return NextResponse.json({ success: false, error: 'Only owner or admin can remove components' }, { status: 403 });
    }

    const body = await req.json();
    const entryId = typeof body.entryId === 'string' ? body.entryId.trim() : '';
    if (!entryId) {
      return NextResponse.json({ success: false, error: 'entryId is required' }, { status: 400 });
    }

    await db.delete(projectComponents).where(and(eq(projectComponents.id, entryId), eq(projectComponents.projectId, params.id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects/:id/components]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
