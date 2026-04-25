import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projectMembers, projects, users } from '@/db/schema';
import { createNotifications, projectHrefForRole } from '@/lib/notifications';

function slugifyProjectName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String(session.user.id);
    const role = String(session.user.role).toUpperCase();

    const allProjects = await db.select().from(projects);
    const allMemberships = await db.select().from(projectMembers);
    const ownerIds = Array.from(new Set(allProjects.map((project) => project.ownerId)));
    const ownerRows = ownerIds.length
      ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ownerIds))
      : [];

    const membershipProjectIds = new Set(
      allMemberships.filter((membership) => membership.userId === userId).map((membership) => membership.projectId)
    );

    const visibleProjects = allProjects.filter((project) => {
      if (role === 'ADMIN' || role === 'FACULTY') return true;
      return project.ownerId === userId || membershipProjectIds.has(project.id) || project.visibility === 'OPEN';
    });

    const ownerMap = new Map(ownerRows.map((row) => [row.id, row.name]));
    const memberCountMap = new Map<string, number>();
    for (const membership of allMemberships) {
      memberCountMap.set(membership.projectId, (memberCountMap.get(membership.projectId) || 0) + 1);
    }

    const data = visibleProjects
      .sort((a, b) => {
        const updatedA = new Date(a.updatedAt).getTime();
        const updatedB = new Date(b.updatedAt).getTime();
        return updatedB - updatedA;
      })
      .map((project) => ({
        ...project,
        ownerName: ownerMap.get(project.ownerId) || 'Unknown',
        memberCount: memberCountMap.get(project.id) || 0,
        isOwner: project.ownerId === userId,
        isMember: membershipProjectIds.has(project.id),
        canJoin: role === 'STUDENT' && project.visibility === 'OPEN' && project.ownerId !== userId && !membershipProjectIds.has(project.id),
      }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/projects]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const visibility = body.visibility === 'OPEN' ? 'OPEN' : 'PRIVATE';
    const status = body.status === 'ACTIVE' || body.status === 'ON_HOLD' || body.status === 'COMPLETED' ? body.status : 'PLANNING';
    const progress = Math.max(0, Math.min(100, Number(body.progress ?? 0) || 0));

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });
    }

    const slugBase = slugifyProjectName(name) || 'project';
    let slug = slugBase;
    let suffix = 1;

    while (true) {
      const existing = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug)).limit(1);
      if (!existing.length) break;
      suffix += 1;
      slug = `${slugBase}-${suffix}`;
    }

    const inserted = await db
      .insert(projects)
      .values({
        name,
        description,
        visibility,
        status,
        progress,
        slug,
        ownerId: String(session.user.id),
      })
      .returning();

    const project = inserted[0];

    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: String(session.user.id),
      role: 'OWNER',
    });

    await createNotifications([
      {
        userId: String(session.user.id),
        type: 'PROJECT_CREATED',
        title: 'Project Created',
        message: `${project.name} is ready for collaboration.`,
        metadata: {
          projectId: project.id,
          href: projectHrefForRole(String(session.user.role).toUpperCase(), project.id),
        },
      },
    ]);

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
