import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ilike, or, and, asc, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const query = (url.searchParams.get('query') || '').trim();
    const role = (url.searchParams.get('role') || '').toUpperCase();
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

    const conditions: any[] = [];
    if (query) {
      conditions.push(or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`), ilike(users.rollNumber, `%${query}%`)));
    }

    if (role === 'STUDENT' || role === 'FACULTY' || role === 'ADMIN') {
      conditions.push(eq(users.role, role));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const result = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(whereClause).orderBy(asc(users.name)).limit(limit);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[GET /api/users/search]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
