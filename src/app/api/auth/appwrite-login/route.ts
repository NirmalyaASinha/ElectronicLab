import { NextRequest, NextResponse } from 'next/server';
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

    // Return user data for client to use with signIn
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        },
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
