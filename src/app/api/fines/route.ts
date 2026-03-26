import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { fines, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateFineSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // STUDENT sees only their own fines; FACULTY/ADMIN see all
    const baseQuery = db.select().from(fines);

    const finalQuery =
      session.user.role === 'STUDENT'
        ? baseQuery.where(eq(fines.studentId, session.user.id))
        : baseQuery;

    const finesList = await finalQuery.orderBy(desc(fines.createdAt));

    return NextResponse.json({ success: true, data: finesList });
  } catch (error) {
    console.error('Fines fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = CreateFineSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { studentId, requestId, itemId, reason, amount } = validation.data;

    // Create fine
    const newFine = await db
      .insert(fines)
      .values({
        studentId,
        requestId,
        itemId,
        reason: reason as 'OVERDUE' | 'DAMAGED' | 'LOST',
        amount,
        issuedBy: session.user.id,
        status: 'PENDING',
      })
      .returning({ id: fines.id });

    // Update user's fine balance
    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
    });

    if (student) {
      await db
        .update(users)
        .set({ fineBalance: student.fineBalance + amount })
        .where(eq(users.id, studentId));
    }

    return NextResponse.json(
      {
        message: 'Fine created successfully',
        fineId: newFine[0].id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Fine creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
