import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { UpdateAcademicInfoSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    const validation = UpdateAcademicInfoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData: Record<string, string | number | null | Date> = {
      updatedAt: new Date(),
    };

    if (validation.data.rollNumber !== undefined) {
      updateData.rollNumber = validation.data.rollNumber || null;
    }
    if (validation.data.semester !== undefined) {
      updateData.semester = validation.data.semester || null;
    }
    if (validation.data.employeeId !== undefined) {
      updateData.employeeId = validation.data.employeeId || null;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id as string));

    return NextResponse.json(
      { message: 'Academic info updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Academic info update error:', error);
    return NextResponse.json(
      { error: 'Failed to update academic info' },
      { status: 500 }
    );
  }
}
