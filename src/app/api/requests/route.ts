import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { issueRequests, issueRequestItems, auditLogs, components, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all requests (or filtered by student if role is STUDENT)
    const baseQuery = db
      .select({
        id: issueRequests.id,
        studentId: issueRequests.studentId,
        studentName: users.name,
        studentRoll: users.rollNumber,
        studentDept: users.department,
        status: issueRequests.status,
        purpose: issueRequests.purpose,
        requestedAt: issueRequests.requestedAt,
        approvedAt: issueRequests.approvedAt,
        issuedAt: issueRequests.issuedAt,
        dueAt: issueRequests.dueAt,
        returnedAt: issueRequests.returnedAt,
        rejectionReason: issueRequests.rejectionReason,
      })
      .from(issueRequests)
      .innerJoin(users, eq(issueRequests.studentId, users.id));

    const requestsData = await (session.user.role === 'STUDENT'
      ? baseQuery.where(eq(issueRequests.studentId, session.user.id)).orderBy(desc(issueRequests.createdAt))
      : baseQuery.orderBy(desc(issueRequests.createdAt)));

    // Fetch items for each request
    const requestsWithItems = await Promise.all(
      requestsData.map(async (req) => {
        const items = await db
          .select({
            id: issueRequestItems.id,
            componentId: issueRequestItems.componentId,
            name: components.name,
            category: components.category,
            quantity: issueRequestItems.quantity,
            returnedQty: issueRequestItems.returnedQty,
          })
          .from(issueRequestItems)
          .innerJoin(components, eq(issueRequestItems.componentId, components.id))
          .where(eq(issueRequestItems.requestId, req.id));

        return {
          ...req,
          items,
        };
      })
    );

    return NextResponse.json({ success: true, data: requestsWithItems });
  } catch (error) {
    console.error('[GET /api/requests]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { facultyId, purpose, durationDays, items } = body;

    // Validate required fields
    if (!facultyId || !purpose || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: facultyId, purpose, items' },
        { status: 400 }
      );
    }

    // Validate purpose length
    if (typeof purpose !== 'string' || purpose.length < 10 || purpose.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Purpose must be between 10 and 500 characters' },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = durationDays || 7;
    if (![3, 7, 14].includes(duration)) {
      return NextResponse.json(
        { success: false, error: 'Duration must be 3, 7, or 14 days' },
        { status: 400 }
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items must be a non-empty array' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.componentId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Each item must have componentId and quantity >= 1' },
          { status: 400 }
        );
      }
    }

    // Create request without transaction support (neon-http doesn't support transactions)
    try {
      const now = new Date();

      // Step 1: Create request
      const newRequest = await db
        .insert(issueRequests)
        .values({
          studentId: session.user.id,
          facultyId,
          status: 'PENDING',
          purpose,
          requestedAt: now,
        })
        .returning({ id: issueRequests.id });

      const requestId = newRequest[0].id;

      // Step 2: Create request items
      await db.insert(issueRequestItems).values(
        items.map((item: { componentId: string; quantity: number }) => ({
          requestId,
          componentId: item.componentId,
          quantity: item.quantity,
        }))
      );

      // Step 3: Log to audit logs
      await db.insert(auditLogs).values({
        actorId: session.user.id,
        action: 'REQUEST_CREATED',
        entityType: 'REQUEST',
        entityId: requestId,
        after: { status: 'PENDING', itemsCount: items.length },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Request created successfully',
          requestId,
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('[POST /api/requests - DB Error]', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create request' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[POST /api/requests]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
