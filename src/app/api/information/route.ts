import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { information } from '@/db/schema';
import { and, desc, eq, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = req.nextUrl;
    const search = url.searchParams.get('q');
    const pinned = url.searchParams.get('pinned');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const conditions: any[] = [eq(information.isActive, true)];

    if (pinned === 'true') {
      conditions.push(eq(information.pinned, true));
    }

    // simple search support on title/content
    if (search) {
      conditions.push(or(
        // using ILIKE via ilike would be nicer but keep simple
        // Drizzle ilike helper could be used; falling back to raw where
        // NOTE: keep portable by searching only title for now
        eq(information.title, search)
      ));
    }

    const rows = await db
      .select()
      .from(information)
      .where(and(...conditions))
      .orderBy(desc(information.pinned), desc(information.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/information]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // Only admins or faculty can create
    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    // Validate/coerce inputs to avoid passing bad types to Postgres
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const pinned = Boolean(body.pinned);

    const visibleFrom = body.visibleFrom ? new Date(body.visibleFrom) : null;
    const visibleUntil = body.visibleUntil ? new Date(body.visibleUntil) : null;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    try {
      const authorId = String(session.user.id);
      const authorRole = String(role).toUpperCase();

      const ins = await db.insert(information).values({
        title,
        content,
        authorId,
        authorRole,
        pinned,
        visibleFrom: body.visibleFrom ? new Date(body.visibleFrom).toISOString() : null,
        visibleUntil: body.visibleUntil ? new Date(body.visibleUntil).toISOString() : null,
      }).returning();

      return NextResponse.json({ success: true, data: Array.isArray(ins) ? ins[0] : ins });
    } catch (dbErr: any) {
      console.error('[POST /api/information] DB error, body=', { title, content, pinned, visibleFrom, visibleUntil, role, authorId: session.user.id });
      console.error('[POST /api/information] DB error details=', {
        name: dbErr?.name,
        message: dbErr?.message,
        code: dbErr?.code,
        detail: dbErr?.detail,
        hint: dbErr?.hint,
        constraint: dbErr?.constraint,
        table: dbErr?.table,
        column: dbErr?.column,
        cause: dbErr?.cause,
        causeMessage: dbErr?.cause?.message,
        causeCode: dbErr?.cause?.code,
        causeDetail: dbErr?.cause?.detail,
        causeHint: dbErr?.cause?.hint,
        causeConstraint: dbErr?.cause?.constraint,
        causeTable: dbErr?.cause?.table,
        causeColumn: dbErr?.cause?.column,
        stack: dbErr?.stack,
      });
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
  } catch (error) {
    console.error('[POST /api/information]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
