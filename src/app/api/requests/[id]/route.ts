import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import {
  issueRequests,
  notifications,
  auditLogs,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
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
    const { action, rejectionReason } = body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
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

    // Check if request status is PENDING
    if (currentRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Request is not pending' },
        { status: 400 }
      );
    }

    // Process action without transaction support (neon-http doesn't support transactions)
    try {
      if (action === 'APPROVE') {
        // Update request status to APPROVED
        await db
          .update(issueRequests)
          .set({
            status: 'APPROVED',
            approvedAt: new Date(),
          })
          .where(eq(issueRequests.id, requestId));

        // Create notification
        await db.insert(notifications).values({
          userId: currentRequest.studentId,
          type: 'REQUEST_APPROVED',
          title: 'Request Approved',
          message: `Your component request has been approved by faculty.`,
          metadata: { requestId },
          isRead: false,
        });

        // Log to audit logs
        await db.insert(auditLogs).values({
          actorId: session.user.id,
          action: 'REQUEST_APPROVED',
          entityType: 'REQUEST',
          entityId: requestId,
          after: { status: 'APPROVED' },
        });
      } else if (action === 'REJECT') {
        if (!rejectionReason) {
          return NextResponse.json(
            { success: false, error: 'Rejection reason is required' },
            { status: 400 }
          );
        }

        // Update request status to REJECTED
        await db
          .update(issueRequests)
          .set({
            status: 'REJECTED',
            rejectionReason,
            approvedAt: new Date(),
          })
          .where(eq(issueRequests.id, requestId));

        // Create notification
        await db.insert(notifications).values({
          userId: currentRequest.studentId,
          type: 'REQUEST_REJECTED',
          title: 'Request Rejected',
          message: `Your component request has been rejected. Reason: ${rejectionReason}`,
          metadata: { requestId, reason: rejectionReason },
          isRead: false,
        });

        // Log to audit logs
        await db.insert(auditLogs).values({
          actorId: session.user.id,
          action: 'REQUEST_REJECTED',
          entityType: 'REQUEST',
          entityId: requestId,
          after: { status: 'REJECTED', reason: rejectionReason },
        });
      }

      return NextResponse.json({
        success: true,
        message: action === 'APPROVE' ? 'Request approved successfully' : 'Request rejected successfully',
      });
    } catch (dbError) {
      console.error('[PATCH /api/requests/[id] - DB Error]', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to process request' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PATCH /api/requests/[id]]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
