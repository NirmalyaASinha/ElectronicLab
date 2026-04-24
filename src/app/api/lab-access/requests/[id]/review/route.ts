import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labAccessHistory, labAccessRequests, labs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const decision = typeof body.decision === 'string' ? body.decision.trim().toUpperCase() : '';
    const decisionNote = typeof body.decisionNote === 'string' ? body.decisionNote.trim() : '';

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Decision must be APPROVED or REJECTED' }, { status: 400 });
    }

    const requestRow = await db.query.labAccessRequests.findFirst({
      where: eq(labAccessRequests.id, id),
    });

    if (!requestRow) {
      return NextResponse.json({ success: false, error: 'Lab access request not found' }, { status: 404 });
    }

    const labRow = await db.query.labs.findFirst({
      where: and(eq(labs.id, requestRow.labId), eq(labs.responsibleFacultyId, session.user.id)),
    });

    if (!labRow) {
      return NextResponse.json({ success: false, error: 'You are not authorized to review this request' }, { status: 403 });
    }

    const updatedRequests = await db
      .update(labAccessRequests)
      .set({
        status: decision as 'APPROVED' | 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        decisionNote: decisionNote || null,
      })
      .where(eq(labAccessRequests.id, id))
      .returning({
        id: labAccessRequests.id,
        labId: labAccessRequests.labId,
        studentId: labAccessRequests.studentId,
        reason: labAccessRequests.reason,
        requestedFor: labAccessRequests.requestedFor,
        durationMinutes: labAccessRequests.durationMinutes,
        status: labAccessRequests.status,
        reviewedBy: labAccessRequests.reviewedBy,
        reviewedAt: labAccessRequests.reviewedAt,
        decisionNote: labAccessRequests.decisionNote,
      });

    if (decision === 'APPROVED') {
      await db.insert(labAccessHistory).values({
        requestId: requestRow.id,
        labId: requestRow.labId,
        studentId: requestRow.studentId,
        facultyId: session.user.id,
        accessReason: requestRow.reason,
        status: 'ACTIVE',
        accessGrantedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, data: updatedRequests[0] });
  } catch (error) {
    console.error('[POST /api/lab-access/requests/[id]/review]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}