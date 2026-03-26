import { NextRequest, NextResponse } from 'next/server';
import { sendOTPViaAppwrite } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { email, flow } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Resend OTP via Appwrite
    const result = await sendOTPViaAppwrite(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to resend OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to resend OTP' },
      { status: 500 }
    );
  }
}
