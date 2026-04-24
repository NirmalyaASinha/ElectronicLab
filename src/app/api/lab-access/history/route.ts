import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labAccessHistory, labAccessRequests, labs, users } from '@/db/schema';
import { aliasedTable, desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const studentUsers = aliasedTable(users, 'student_users');
    const facultyUsers = aliasedTable(users, 'faculty_users');

    const whereClause =
      session.user.role === 'STUDENT'
        ? eq(labAccessHistory.studentId, session.user.id)
        : session.user.role === 'FACULTY'
          ? eq(labs.responsibleFacultyId, session.user.id)
          : undefined;

    const rows = await db
      .select({
        id: labAccessHistory.id,
        requestId: labAccessHistory.requestId,
        labId: labs.id,
        labName: labs.name,
        labLocation: labs.location,
        studentId: labAccessHistory.studentId,
        studentName: studentUsers.name,
        studentRoll: studentUsers.rollNumber,
        facultyId: labAccessHistory.facultyId,
        facultyName: facultyUsers.name,
        accessReason: labAccessHistory.accessReason,
        status: labAccessHistory.status,
        accessGrantedAt: labAccessHistory.accessGrantedAt,
        accessEndedAt: labAccessHistory.accessEndedAt,
        notes: labAccessHistory.notes,
        requestStatus: labAccessRequests.status,
      })
      .from(labAccessHistory)
      .innerJoin(labs, eq(labAccessHistory.labId, labs.id))
      .innerJoin(studentUsers, eq(labAccessHistory.studentId, studentUsers.id))
      .innerJoin(facultyUsers, eq(labAccessHistory.facultyId, facultyUsers.id))
      .innerJoin(labAccessRequests, eq(labAccessHistory.requestId, labAccessRequests.id))
      .where(whereClause)
      .orderBy(desc(labAccessHistory.accessGrantedAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/lab-access/history]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}