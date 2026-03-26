import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const facultyList = await db
      .select({
        id: users.id,
        name: users.name,
        department: users.department,
        email: users.email,
      })
      .from(users)
      .where(eq(users.role, 'FACULTY'));

    return NextResponse.json({ success: true, data: facultyList });
  } catch (error) {
    console.error('[GET /api/faculty]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
