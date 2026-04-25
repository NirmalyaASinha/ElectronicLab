import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projectMembers, projects } from '@/db/schema';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const projectRows = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
    if (!projectRows.length) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const role = String(session.user.role).toUpperCase();
    const currentUserId = String(session.user.id);
    const project = projectRows[0];
    const memberRows = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, params.id), eq(projectMembers.id, params.memberId))).limit(1);
    if (!memberRows.length) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const member = memberRows[0];
    const canManage = role === 'ADMIN' || project.ownerId === currentUserId;
    const removingSelf = member.userId === currentUserId;

    if (!canManage && !removingSelf) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (member.role === 'OWNER') {
      return NextResponse.json({ success: false, error: 'Project owner cannot be removed' }, { status: 400 });
    }

    await db.delete(projectMembers).where(eq(projectMembers.id, params.memberId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects/:id/members/:memberId]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
