import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { sendOTPViaAppwrite } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, an OTP will be sent',
        },
        { status: 200 }
      );
    }

    // Send OTP via Appwrite
    const otpResult = await sendOTPViaAppwrite(email);

    if (!otpResult.success) {
      console.error('Failed to send OTP:', otpResult.error);
      // Still return success for security
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, an OTP will be sent',
        },
        { status: 200 }
      );
    }

    // In a real application, you would send an email with the OTP here
    // For development, we'll just log it
    console.log(`OTP sent to ${email} - Session ID: ${otpResult.sessionId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, an OTP will be sent',
        // For development only - remove in production
        sessionId: process.env.NODE_ENV === 'development' ? otpResult.sessionId : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success for security
    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, an OTP will be sent',
      },
      { status: 200 }
    );
  }
}
