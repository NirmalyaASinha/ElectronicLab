import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  department: z.string(),
  rollNumber: z.string().optional(),
  employeeId: z.string().optional(),
  semester: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can create users.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = CreateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email, name, password, role, department, rollNumber, employeeId, semester } = validation.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: role as 'STUDENT' | 'FACULTY' | 'ADMIN',
        department,
        rollNumber: role === 'STUDENT' ? rollNumber : undefined,
        employeeId: role === 'FACULTY' ? employeeId : undefined,
        semester: role === 'STUDENT' ? (semester ? parseInt(semester) : undefined) : undefined,
        isActive: true,
      })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    console.log(`[Admin] User created: ${email} (${role})`);

    return NextResponse.json(
      {
        message: `User ${name} (${role}) created successfully!`,
        user: newUser[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Create User] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
