import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { issueRequests, issueRequestItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateRequestSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STUDENT sees only their own requests
    const baseQuery = db.select().from(issueRequests);

    const finalQuery =
      session.user.role === 'STUDENT'
        ? baseQuery.where(eq(issueRequests.studentId, session.user.id))
        : baseQuery;

    const requests = await finalQuery.orderBy(desc(issueRequests.createdAt));

    return NextResponse.json({ data: requests });
  } catch (error) {
    console.error('Requests fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = CreateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { purpose, items } = validation.data;

    // Create request
    const newRequest = await db
      .insert(issueRequests)
      .values({
        studentId: session.user.id,
        status: 'PENDING',
        purpose,
      })
      .returning({ id: issueRequests.id });

    const requestId = newRequest[0].id;

    // Create request items
    await db.insert(issueRequestItems).values(
      items.map((item) => ({
        requestId,
        componentId: item.componentId,
        quantity: item.quantity,
      }))
    );

    return NextResponse.json(
      {
        message: 'Request created successfully',
        requestId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Request creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
