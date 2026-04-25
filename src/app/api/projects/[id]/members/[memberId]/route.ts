import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';

export async function DELETE(req: Request, { params }: { params: { id: string; memberId: string } }) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

  try {
    const { id: projectId, memberId } = params;
    const deleted = await db.delete('project_members').where((pm, { eq }) => eq(pm.id, memberId) || eq(pm.user_id, memberId));
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
