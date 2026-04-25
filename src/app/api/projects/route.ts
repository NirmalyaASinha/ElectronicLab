import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { inArray } from 'drizzle-orm';

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
    const memberRows = await db.query.projectMembers.findMany({ where: (pm, { eq }) => eq(pm.userId, userId) });
    const projectIds = Array.from(new Set(memberRows.map((r) => r.projectId).filter(Boolean)));

    // debug logging to help diagnose missing projects
    console.debug('GET /api/projects - user', { userId, role, memberCount: memberRows.length, sampleProjectIds: projectIds.slice(0, 20) });

    let q: any[] = [];
    try {
      // always include projects owned by the user
      const owned = await db.query.projects.findMany({ where: (p, { eq }) => eq(p.ownerId, userId) });
      q = owned || [];
    } catch (ownedErr) {
      console.error('GET /api/projects - failed to fetch owned projects', ownedErr);
      throw ownedErr;
    }

    if (projectIds.length > 0) {
      try {
        // use drizzle's inArray helper to avoid runtime helper mismatch
        const memberProjects = await db.query.projects.findMany({ where: inArray(projects.id, projectIds) });
        // merge unique by id
        const map: Record<string, any> = {};
        for (const pr of [...q, ...(memberProjects || [])]) map[pr.id] = pr;
        q = Object.values(map);
      } catch (memberErr) {
        console.error('GET /api/projects - failed to fetch member projects', memberErr);
        throw memberErr;
      }
    }

    console.debug('GET /api/projects - result count', { count: Array.isArray(q) ? q.length : 0 });

    return NextResponse.json({ success: true, data: q });
  } catch (err) {
    console.error('GET /api/projects error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

  // Re-export POST handler implemented in route.post.ts so Next can pick it up
  export { POST } from './route.post';
