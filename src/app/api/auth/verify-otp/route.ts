import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { verifyOTPCode } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { email, otpCode, flow } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    // Verify OTP code
    const verifyResult = await verifyOTPCode(email, otpCode);

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Find or create user based on flow
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user && flow === 'register') {
      // User should already exist from registration endpoint
      return NextResponse.json(
        { error: 'User not found. Please register again.' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark user as verified/active
    if (flow === 'register' && !user.isActive) {
      await db
        .update(users)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
