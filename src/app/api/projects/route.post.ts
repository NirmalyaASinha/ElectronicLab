import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const { name, description = '', ownerId } = body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const inserted = await db.insert('projects').values({ name, description, owner_id: ownerId, slug }).returning('*');
    return NextResponse.json({ success: true, data: inserted });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
