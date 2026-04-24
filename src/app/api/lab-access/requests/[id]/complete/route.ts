import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labAccessHistory, labAccessRequests, labs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const requestRow = await db.query.labAccessRequests.findFirst({ where: eq(labAccessRequests.id, id) });
    if (!requestRow) {
      return NextResponse.json({ success: false, error: 'Lab access request not found' }, { status: 404 });
    }

    const labRow = await db.query.labs.findFirst({
      where: and(eq(labs.id, requestRow.labId), eq(labs.responsibleFacultyId, session.user.id)),
    });

    if (!labRow) {
      return NextResponse.json({ success: false, error: 'You are not authorized to update this request' }, { status: 403 });
    }

    const historyRow = await db.query.labAccessHistory.findFirst({ where: eq(labAccessHistory.requestId, id) });

    if (!historyRow) {
      return NextResponse.json({ success: false, error: 'History entry not found for this request' }, { status: 404 });
    }

    const updatedHistory = await db
      .update(labAccessHistory)
      .set({
        status: 'COMPLETED',
        accessEndedAt: new Date(),
      })
      .where(eq(labAccessHistory.requestId, id))
      .returning({
        id: labAccessHistory.id,
        requestId: labAccessHistory.requestId,
        labId: labAccessHistory.labId,
        studentId: labAccessHistory.studentId,
        facultyId: labAccessHistory.facultyId,
        accessReason: labAccessHistory.accessReason,
        status: labAccessHistory.status,
        accessGrantedAt: labAccessHistory.accessGrantedAt,
        accessEndedAt: labAccessHistory.accessEndedAt,
      });

    return NextResponse.json({ success: true, data: updatedHistory[0] });
  } catch (error) {
    console.error('[POST /api/lab-access/requests/[id]/complete]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}