import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/otp';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Resend OTP for an already-authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Send OTP
    const otpResult = await sendOTPEmail(user.email);
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to your email',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending OTP' },
      { status: 500 }
    );
  }
}
