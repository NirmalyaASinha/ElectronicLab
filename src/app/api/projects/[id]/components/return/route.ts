import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });

  const projectId = params.id;
  try {
    const body = await req.json();
    const { recordId } = body;
    const rec = await db.query.projectComponents.findFirst({ where: (pc, { eq }) => eq(pc.id, recordId) });
    if (!rec) return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    if (rec.isReturned) return NextResponse.json({ success: false, error: 'Already returned' }, { status: 400 });

    // mark returned and increment component availability
    await db.update('project_components').set({ is_returned: true, returned_at: new Date().toISOString() }).where((pc, { eq }) => eq(pc.id, recordId));
    await db.update('components').set({ quantity_available: (rec.quantity ?? 0) + (rec.quantity ?? 0) }).where((c, { eq }) => eq(c.id, rec.componentId));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
