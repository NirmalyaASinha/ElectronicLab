import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import {
  issueRequests,
  issueRequestItems,
  components,
  notifications,
  auditLogs,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id: requestId } = await params;

    // Get the request with items
    const request = await db
      .select()
      .from(issueRequests)
      .where(eq(issueRequests.id, requestId));

    if (!request.length) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const currentRequest = request[0];

    // Check if request status is APPROVED
    if (currentRequest.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Request is not approved' },
        { status: 400 }
      );
    }

    // Get request items
    const requestItems = await db
      .select()
      .from(issueRequestItems)
      .where(eq(issueRequestItems.requestId, requestId));

    if (!requestItems.length) {
      return NextResponse.json(
        { success: false, error: 'No items in request' },
        { status: 400 }
      );
    }

    // Process without transaction support (neon-http doesn't support transactions)
    try {
      const now = new Date();
      // Default to 7 days if not specified
      const durationDays = 7;
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + durationDays);

      // Step 1: Verify quantities and decrement
      for (const item of requestItems) {
        // Verify component still has available quantity
        const componentData = await db
          .select()
          .from(components)
          .where(eq(components.id, item.componentId));

        if (!componentData.length) {
          return NextResponse.json(
            { success: false, error: `Component ${item.componentId} not found` },
            { status: 404 }
          );
        }

        const comp = componentData[0];
        if (comp.quantityAvailable < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient quantity for ${comp.name}. Available: ${comp.quantityAvailable}, Requested: ${item.quantity}`,
            },
            { status: 400 }
          );
        }

        // Decrement component quantity
        await db
          .update(components)
          .set({
            quantityAvailable: sql`${components.quantityAvailable} - ${item.quantity}`,
          })
          .where(eq(components.id, item.componentId));
      }

      // Step 2: Update request status to ISSUED
      await db
        .update(issueRequests)
        .set({
          status: 'ISSUED',
          issuedAt: now,
          dueAt: dueDate,
        })
        .where(eq(issueRequests.id, requestId));

      // Step 3: Create notification
      await db.insert(notifications).values({
        userId: currentRequest.studentId,
        type: 'COMPONENTS_ISSUED',
        title: 'Components Issued',
        message: `Your requested components have been issued. Due date: ${dueDate.toLocaleDateString()}`,
        metadata: { requestId, dueDate: dueDate.toISOString() },
        isRead: false,
      });

      // Step 4: Log to audit logs
      await db.insert(auditLogs).values({
        actorId: session.user.id,
        action: 'REQUEST_ISSUED',
        entityType: 'REQUEST',
        entityId: requestId,
        after: { status: 'ISSUED', itemsIssued: requestItems.length, dueDate },
      });

      return NextResponse.json({
        success: true,
        message: 'Request marked as issued successfully',
      });
    } catch (dbError) {
      console.error('[POST /api/requests/[id]/issue - DB Error]', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to process request' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[POST /api/requests/[id]/issue]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
