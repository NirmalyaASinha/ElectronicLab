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

    const normalizedEmail = (email as string).toLowerCase();
    console.log('[Appwrite Login] Looking up user with email:', normalizedEmail);

    // Look up user in Neon DB by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    console.log('[Appwrite Login] User found:', user ? 'yes' : 'no');
    if (user) {
      console.log('[Appwrite Login] User active:', user.isActive);
    }

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
            ? '/student'
            : user.role === 'FACULTY'
              ? '/faculty'
              : '/admin',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Appwrite Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete login' },
      { status: 500 }
    );
  }
}
