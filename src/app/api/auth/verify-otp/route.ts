import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/appwrite-auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, otpCode } = await req.json();

    if (!userId || !otpCode) {
      return NextResponse.json(
        { error: 'User ID and OTP code are required' },
        { status: 400 }
      );
    }

    // Verify OTP code
    try {
      const isValid = await verifyOTP(userId, otpCode);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'OTP verified successfully',
        },
        { status: 200 }
      );
    } catch (otpError: any) {
      return NextResponse.json(
        { error: otpError.message || 'Invalid OTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
