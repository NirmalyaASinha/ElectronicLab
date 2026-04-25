import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const { userId } = body;
    const projectId = params.id;
    const existing = await db.query.projectMembers.findFirst({ where: (pm, { eq }) => eq(pm.projectId, projectId) && eq(pm.userId, userId) });
    if (existing) return NextResponse.json({ success: false, error: 'Already a member' }, { status: 400 });
    const inserted = await db.insert('project_members').values({ project_id: projectId, user_id: userId }).returning('*');
    return NextResponse.json({ success: true, data: inserted });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const projectId = params.id;
    const members = await db.query.projectMembers.findMany({ where: (pm, { eq }) => eq(pm.projectId, projectId) });
    const userIds = members.map((m) => m.userId).filter(Boolean);
    const users = userIds.length > 0 ? await db.query.users.findMany({ where: (u, { in: _in }) => _in(u.id, userIds) }) : [];
    // merge
    const payload = members.map((m) => ({ ...m, user: users.find((u) => u.id === m.userId) || null }));
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
