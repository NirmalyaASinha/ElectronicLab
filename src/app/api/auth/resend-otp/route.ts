import { NextRequest, NextResponse } from 'next/server';
import { resendOTPEmail } from '@/lib/otp-service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Resend OTP via Resend service
    try {
      await resendOTPEmail(email);
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
        },
        { status: 200 }
      );
    } catch (otpError) {
      const err = otpError as Error;
      return NextResponse.json(
        { error: err.message || 'Failed to resend OTP' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to resend OTP' },
      { status: 500 }
    );
  }
}
