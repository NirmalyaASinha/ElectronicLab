import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labs, users } from '@/db/schema';
import { aliasedTable, and, desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const facultyUsers = aliasedTable(users, 'faculty_users');

    const rows = await db
      .select({
        id: labs.id,
        name: labs.name,
        description: labs.description,
        location: labs.location,
        responsibleFacultyId: labs.responsibleFacultyId,
        responsibleFacultyName: facultyUsers.name,
        responsibleFacultyEmail: facultyUsers.email,
        isActive: labs.isActive,
        createdAt: labs.createdAt,
      })
      .from(labs)
      .leftJoin(facultyUsers, eq(labs.responsibleFacultyId, facultyUsers.id))
      .where(session.user.role === 'ADMIN' ? undefined : eq(labs.isActive, true))
      .orderBy(desc(labs.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/labs]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const responsibleFacultyId = typeof body.responsibleFacultyId === 'string' ? body.responsibleFacultyId.trim() : '';

    if (!name || !responsibleFacultyId) {
      return NextResponse.json({ success: false, error: 'Lab name and responsible faculty are required' }, { status: 400 });
    }

    const facultyUser = await db.query.users.findFirst({
      where: and(eq(users.id, responsibleFacultyId), eq(users.role, 'FACULTY')),
    });

    if (!facultyUser) {
      return NextResponse.json({ success: false, error: 'Responsible faculty must be a valid faculty member' }, { status: 400 });
    }

    const created = await db
      .insert(labs)
      .values({
        name,
        description: description || null,
        location: location || null,
        responsibleFacultyId,
        createdBy: session.user.id,
      })
      .returning({
        id: labs.id,
        name: labs.name,
        description: labs.description,
        location: labs.location,
        responsibleFacultyId: labs.responsibleFacultyId,
        isActive: labs.isActive,
        createdAt: labs.createdAt,
      });

    return NextResponse.json({ success: true, data: created[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/labs]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}