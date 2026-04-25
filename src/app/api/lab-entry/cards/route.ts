import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labRfidCards, users } from '@/db/schema';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const rows = await db
      .select({
        id: labRfidCards.id,
        studentId: labRfidCards.studentId,
        studentName: users.name,
        studentEmail: users.email,
        studentRoll: users.rollNumber,
        rfidUid: labRfidCards.rfidUid,
        isActive: labRfidCards.isActive,
        assignedAt: labRfidCards.assignedAt,
        revokedAt: labRfidCards.revokedAt,
      })
      .from(labRfidCards)
      .innerJoin(users, eq(labRfidCards.studentId, users.id))
      .orderBy(desc(labRfidCards.assignedAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/lab-entry/cards]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
