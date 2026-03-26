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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const requestId = params.id;
    const body = await req.json();
    const { returnedItems } = body;

    if (!returnedItems || !Array.isArray(returnedItems) || returnedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items specified for return' },
        { status: 400 }
      );
    }

    // Get the request
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

    // Check if request status is ISSUED
    if (currentRequest.status !== 'ISSUED') {
      return NextResponse.json(
        { success: false, error: 'Request is not in issued status' },
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
      let allItemsReturned = true;
      const returnedComponentIds: string[] = [];

      // Step 1: Update item return quantities and increment component quantities
      for (const returnedItem of returnedItems) {
        const itemId = returnedItem.id;
        const returnedQty = returnedItem.quantity || 0;

        if (returnedQty > 0) {
          // Get the item to find component info
          const item = await db
            .select()
            .from(issueRequestItems)
            .where(eq(issueRequestItems.id, itemId));

          if (!item.length) {
            return NextResponse.json(
              { success: false, error: `Item ${itemId} not found` },
              { status: 404 }
            );
          }

          const currentItem = item[0];

          // Update the returned quantity for this item
          await db
            .update(issueRequestItems)
            .set({
              returnedQty: sql`${issueRequestItems.returnedQty} + ${returnedQty}`,
            })
            .where(eq(issueRequestItems.id, itemId));

          // Increment component available quantity
          await db
            .update(components)
            .set({
              quantityAvailable: sql`${components.quantityAvailable} + ${returnedQty}`,
            })
            .where(eq(components.id, currentItem.componentId));

          returnedComponentIds.push(currentItem.componentId);

          // Check if this item is fully returned
          const totalReturned = currentItem.returnedQty + returnedQty;
          if (totalReturned < currentItem.quantity) {
            allItemsReturned = false;
          }
        }
      }

      // Step 2: Check if all items are fully returned before updating status
      if (allItemsReturned) {
        const allRequestItems = await db
          .select()
          .from(issueRequestItems)
          .where(eq(issueRequestItems.requestId, requestId));

        for (const item of allRequestItems) {
          if (item.returnedQty < item.quantity) {
            allItemsReturned = false;
            break;
          }
        }
      }

      // Step 3: Update request status (only mark as RETURNED if all items returned)
      if (allItemsReturned) {
        await db
          .update(issueRequests)
          .set({
            status: 'RETURNED',
            returnedAt: new Date(),
          })
          .where(eq(issueRequests.id, requestId));
      }

      // Step 4: Create notification
      const totalReturned = returnedItems.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      );

      await db.insert(notifications).values({
        userId: currentRequest.studentId,
        type: 'COMPONENTS_RETURNED',
        title: 'Components Returned',
        message: `${totalReturned} component(s) have been received and processed.${
          allItemsReturned ? ' All components have been returned.' : ''
        }`,
        metadata: { requestId, totalReturned, allReturned: allItemsReturned },
        isRead: false,
      });

      // Step 5: Log to audit logs
      await db.insert(auditLogs).values({
        actorId: session.user.id,
        action: allItemsReturned ? 'REQUEST_RETURNED' : 'REQUEST_PARTIAL_RETURN',
        entityType: 'REQUEST',
        entityId: requestId,
        after: {
          status: allItemsReturned ? 'RETURNED' : 'ISSUED',
          itemsReturned: totalReturned,
        },
      });

      return NextResponse.json({
        success: true,
        message: allItemsReturned
          ? 'All items marked as returned successfully'
          : 'Items marked as returned (partial return)',
      });
    } catch (dbError) {
      console.error('[POST /api/requests/[id]/return - DB Error]', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to process return' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[POST /api/requests/[id]/return]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
