import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * After OTP verification, create a temporary reset token  
 * for the user to set a new password
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a temporary reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with reset token
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json(
      {
        success: true,
        resetToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create reset token error:', error);
    return NextResponse.json(
      { error: 'Failed to create reset token' },
      { status: 500 }
    );
  }
}
