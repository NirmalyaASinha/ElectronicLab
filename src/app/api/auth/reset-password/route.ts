import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    // Check if token has expired
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user with new password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
