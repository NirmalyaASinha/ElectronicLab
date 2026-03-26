import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '@/lib/otp';
import { LoginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
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
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login step 1 error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
