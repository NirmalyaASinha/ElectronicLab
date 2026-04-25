import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { projects, projectMembers } from '@/db/schema';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description = '', ownerId: rawOwnerId } = body;
    const ownerId = rawOwnerId || (session.user.id as string);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // neon-http driver doesn't support transactions; do sequential inserts with compensating rollback
    try {
      const ins = await db.insert(projects).values({ name, description, ownerId, slug }).returning();
      const projectId = Array.isArray(ins) ? ins[0].id : (ins as any).id;

      try {
        await db.insert(projectMembers).values({ projectId, userId: ownerId }).returning();
      } catch (memberErr) {
        console.error('failed to add project owner as member, rolling back project', memberErr);
        try {
          // best-effort rollback; ignore TS typing for dynamic delete
          // @ts-ignore
          await db.delete('projects').where((p, { eq }) => eq(p.id, projectId));
        } catch (delErr) {
          console.error('failed to rollback project after member insert failure', delErr);
        }
        throw memberErr;
      }

      return NextResponse.json({ success: true, data: ins });
    } catch (e: any) {
      const msg = String(e?.message || e);
      console.error('POST /api/projects error:', e);
      if (msg.includes('duplicate') || msg.includes('unique') || (e.code && e.code === '23505')) {
        return NextResponse.json({ success: false, error: 'Project slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  } catch (err) {
    console.error('POST /api/projects error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
