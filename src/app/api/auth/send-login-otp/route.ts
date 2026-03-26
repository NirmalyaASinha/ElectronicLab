import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/appwrite-auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Send OTP via Appwrite
    try {
      const userId = await sendOTP(email);
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
          userId,
        },
        { status: 200 }
      );
    } catch (otpError: any) {
      return NextResponse.json(
        { error: otpError.message || 'Failed to send OTP' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send login OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
