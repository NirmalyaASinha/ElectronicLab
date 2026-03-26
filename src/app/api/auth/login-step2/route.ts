import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp);
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a secure token that includes user info
    // This will be used to create the NextAuth session
    const sessionToken = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      })
    ).toString('base64');

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        sessionToken,
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
    console.error('Login step 2 error:', error);
    return NextResponse.json(
      { error: 'An error occurred during OTP verification' },
      { status: 500 }
    );
  }
}
