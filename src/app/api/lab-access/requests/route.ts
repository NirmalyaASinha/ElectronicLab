import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labAccessRequests, labs, users } from '@/db/schema';
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
        ? eq(labAccessRequests.studentId, session.user.id)
        : session.user.role === 'FACULTY'
          ? eq(labs.responsibleFacultyId, session.user.id)
          : undefined;

    const rows = await db
      .select({
        id: labAccessRequests.id,
        labId: labs.id,
        labName: labs.name,
        labLocation: labs.location,
        labDescription: labs.description,
        studentId: labAccessRequests.studentId,
        studentName: studentUsers.name,
        studentEmail: studentUsers.email,
        studentRoll: studentUsers.rollNumber,
        facultyId: labs.responsibleFacultyId,
        facultyName: facultyUsers.name,
        facultyEmail: facultyUsers.email,
        reason: labAccessRequests.reason,
        requestedFor: labAccessRequests.requestedFor,
        durationMinutes: labAccessRequests.durationMinutes,
        status: labAccessRequests.status,
        reviewedBy: labAccessRequests.reviewedBy,
        reviewedAt: labAccessRequests.reviewedAt,
        decisionNote: labAccessRequests.decisionNote,
        createdAt: labAccessRequests.createdAt,
      })
      .from(labAccessRequests)
      .innerJoin(labs, eq(labAccessRequests.labId, labs.id))
      .innerJoin(studentUsers, eq(labAccessRequests.studentId, studentUsers.id))
      .innerJoin(facultyUsers, eq(labs.responsibleFacultyId, facultyUsers.id))
      .where(whereClause)
      .orderBy(desc(labAccessRequests.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/lab-access/requests]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const labId = typeof body.labId === 'string' ? body.labId.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const requestedFor = typeof body.requestedFor === 'string' ? new Date(body.requestedFor) : null;
    const durationMinutes = Number(body.durationMinutes ?? 120);

    if (!labId || !reason || !requestedFor || Number.isNaN(requestedFor.getTime())) {
      return NextResponse.json({ success: false, error: 'Lab, reason, and requested time are required' }, { status: 400 });
    }

    const lab = await db.query.labs.findFirst({ where: eq(labs.id, labId) });
    if (!lab || !lab.isActive) {
      return NextResponse.json({ success: false, error: 'Lab not found or inactive' }, { status: 404 });
    }

    const created = await db
      .insert(labAccessRequests)
      .values({
        labId,
        studentId: session.user.id,
        reason,
        requestedFor,
        durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 120,
      })
      .returning({
        id: labAccessRequests.id,
        labId: labAccessRequests.labId,
        studentId: labAccessRequests.studentId,
        reason: labAccessRequests.reason,
        requestedFor: labAccessRequests.requestedFor,
        durationMinutes: labAccessRequests.durationMinutes,
        status: labAccessRequests.status,
        createdAt: labAccessRequests.createdAt,
      });

    return NextResponse.json({ success: true, data: created[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/lab-access/requests]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}