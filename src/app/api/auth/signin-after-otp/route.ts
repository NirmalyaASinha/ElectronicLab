import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // In a real application, you would create a session here
    // For NextAuth, the session should be created through the callback system
    // This is a simplified version that just confirms the OTP verification
    
    // Return user data that can be used for role-based redirect
    const redirectPath =
      user.role === 'STUDENT'
        ? '/student'
        : user.role === 'FACULTY'
          ? '/faculty'
          : '/admin';

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        redirectPath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sign in after OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in after OTP verification' },
      { status: 500 }
    );
  }
}
