import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labRfidCards } from '@/db/schema';
import { users } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
    const rfidUid = typeof body.rfidUid === 'string' ? body.rfidUid.trim().toUpperCase() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!studentId || !rfidUid) {
      return NextResponse.json({ success: false, error: 'Student and RFID UID are required' }, { status: 400 });
    }

    const student = await db.query.users.findFirst({
      where: and(eq(users.id, studentId), eq(users.role, 'STUDENT')),
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const conflict = await db.query.labRfidCards.findFirst({
      where: eq(labRfidCards.rfidUid, rfidUid),
    });

    if (conflict && conflict.studentId !== studentId) {
      return NextResponse.json({ success: false, error: 'This RFID card is already assigned to another student' }, { status: 409 });
    }

    const existing = await db.query.labRfidCards.findFirst({
      where: eq(labRfidCards.studentId, studentId),
    });

    const saved = existing
      ? await db
          .update(labRfidCards)
          .set({
            rfidUid,
            isActive: true,
            revokedAt: null,
            notes: notes || null,
            assignedAt: new Date(),
          })
          .where(eq(labRfidCards.studentId, studentId))
          .returning()
      : await db
          .insert(labRfidCards)
          .values({
            studentId,
            rfidUid,
            isActive: true,
            notes: notes || null,
          })
          .returning();

    return NextResponse.json({ success: true, data: saved[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/lab-entry/bind-card]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
