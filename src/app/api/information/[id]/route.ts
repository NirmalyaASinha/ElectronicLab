import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { information } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const rows = await db.select().from(information).where(eq(information.id, id), eq(information.isActive, true));
    if (!rows || rows.length === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[GET /api/information/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    const { id } = params;

    // Only admin or faculty can update
    if (role !== 'ADMIN' && role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const raw = await req.json();
    // sanitize update body
    const body: any = {};
    if (typeof raw.title === 'string') body.title = raw.title.trim();
    if (typeof raw.content === 'string') body.content = raw.content.trim();
    if (raw.pinned !== undefined) body.pinned = Boolean(raw.pinned);
    if ('visibleFrom' in raw) body.visibleFrom = raw.visibleFrom ? new Date(raw.visibleFrom) : null;
    if ('visibleUntil' in raw) body.visibleUntil = raw.visibleUntil ? new Date(raw.visibleUntil) : null;

    

    await db.update(information).set(body).where(eq(information.id, id));
    const updated = await db.select().from(information).where(eq(information.id, id));
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[PATCH /api/information/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    const { id } = params;

    if (role !== 'ADMIN' && role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // soft-delete
    await db.update(information).set({ isActive: false }).where(eq(information.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/information/:id]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
