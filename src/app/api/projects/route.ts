import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';

export async function GET() {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });

  const userId = session.user.id as string;
  const role = session.user.role as string;

  try {
    if (role === 'ADMIN') {
      const projects = await db.select().from('projects').limit(200);
      return NextResponse.json({ success: true, data: projects });
    }

    // return projects where the user is a member or owner
    const q = await db.query.projects.findMany({
      where: (projects, { eq, or, is }) => or(eq(projects.ownerId, userId), is(projects.id, db.select().from('project_members').where('user_id', '=', userId).select('project_id'))),
    });

    return NextResponse.json({ success: true, data: q });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
