import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { RegisterSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { sendOTPViaAppwrite } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name, role, department, rollNumber, employeeId, semester } =
      validation.data;

    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Send OTP via Appwrite
    const otpResult = await sendOTPViaAppwrite(email);
    if (!otpResult.success) {
      console.error('Failed to send OTP:', otpResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Create user in database (initially unverified)
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role: role as 'STUDENT' | 'FACULTY',
        department,
        rollNumber: role === 'STUDENT' ? rollNumber : undefined,
        employeeId: role === 'FACULTY' ? employeeId : undefined,
        semester: role === 'STUDENT' ? semester : undefined,
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    return NextResponse.json(
      { 
        message: 'OTP sent to your email. Please verify to complete registration.',
        user: newUser[0],
        sessionId: otpResult.sessionId,
        appwriteUserId: otpResult.userId,
        requiresOTPVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
