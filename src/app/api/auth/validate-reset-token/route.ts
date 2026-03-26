import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });

    if (!user) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    // Check if token has expired
    const now = new Date();
    if (!user.resetTokenExpiry || user.resetTokenExpiry < now) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
