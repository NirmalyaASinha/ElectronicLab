import { NextRequest, NextResponse } from 'next/server';
import { verifyOTPCode } from '@/lib/otp-service';

export async function POST(req: NextRequest) {
  try {
    const { email, otpCode } = await req.json();

    console.log('[Verify OTP API] Received request for email:', email);

    if (!email || !otpCode) {
      console.log('[Verify OTP API] Missing email or otpCode');
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    // Verify OTP code using Resend service
    const isValid = await verifyOTPCode(email, otpCode);

    if (!isValid) {
      console.log('[Verify OTP API] OTP verification failed');
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      );
    }

    console.log('[Verify OTP API] OTP verified successfully');
    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
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
