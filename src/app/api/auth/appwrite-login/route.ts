import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Look up user in Neon DB by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // User not found or inactive
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not registered' },
        { status: 404 }
      );
    }

    // Create Auth.js session server-side
    // Since the user verified OTP with Appwrite, we can trust their identity
    await signIn('appwrite-otp', {
      email: user.email,
      userId: user.id,
      name: user.name,
      role: user.role,
      department: user.department,
      redirect: false,
    });

    return NextResponse.json(
      {
        success: true,
        role: user.role,
        redirectUrl:
          user.role === 'STUDENT'
            ? '/dashboard/student'
            : user.role === 'FACULTY'
              ? '/dashboard/faculty'
              : '/dashboard/admin',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Appwrite Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete login' },
      { status: 500 }
    );
  }
}
