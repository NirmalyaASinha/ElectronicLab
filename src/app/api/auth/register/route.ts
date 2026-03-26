import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { RegisterSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

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
      { message: 'User registered successfully', user: newUser[0] },
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
