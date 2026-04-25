import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labEntrySessions, labs, users, labRfidCards } from '@/db/schema';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause =
      session.user.role === 'STUDENT'
        ? eq(labEntrySessions.studentId, session.user.id)
        : session.user.role === 'FACULTY'
          ? eq(labs.responsibleFacultyId, session.user.id)
          : undefined;

    const rows = await db
      .select({
        id: labEntrySessions.id,
        labId: labEntrySessions.labId,
        labName: labs.name,
        labLocation: labs.location,
        studentId: labEntrySessions.studentId,
        studentName: users.name,
        studentRoll: users.rollNumber,
        status: labEntrySessions.status,
        entryAt: labEntrySessions.entryAt,
        exitAt: labEntrySessions.exitAt,
        notes: labEntrySessions.notes,
        rfidUid: labRfidCards.rfidUid,
      })
      .from(labEntrySessions)
      .innerJoin(labs, eq(labEntrySessions.labId, labs.id))
      .innerJoin(users, eq(labEntrySessions.studentId, users.id))
      .innerJoin(labRfidCards, eq(labEntrySessions.rfidCardId, labRfidCards.id))
      .where(whereClause)
      .orderBy(desc(labEntrySessions.entryAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/lab-entry/history]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
