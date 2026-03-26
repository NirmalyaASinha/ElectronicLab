import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { components, issueRequestItems, issueRequests, users } from '@/db/schema';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';

interface DueDateResponseItem {
  date: string;
  requestId: string;
  label: string;
  isOverdue: boolean;
  status: string;
  purpose: string;
  studentName?: string;
  items: Array<{
    id: string;
    componentId: string;
    name: string;
    category: string;
    quantity: number;
  }>;
}

const ACTIVE_STATUSES = ['ISSUED', 'OVERDUE'] as const;

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const baseRows = await db
      .select({
        id: issueRequests.id,
        dueAt: issueRequests.dueAt,
        purpose: issueRequests.purpose,
        status: issueRequests.status,
        studentName: users.name,
      })
      .from(issueRequests)
      .innerJoin(users, eq(issueRequests.studentId, users.id))
      .where(
        and(
          inArray(issueRequests.status, [...ACTIVE_STATUSES]),
          isNotNull(issueRequests.dueAt),
          session.user.role === 'STUDENT'
            ? eq(issueRequests.studentId, session.user.id)
            : undefined
        )
      )
      .orderBy(desc(issueRequests.dueAt));

    const requestIds = baseRows.map((row) => row.id);

    const itemRows = requestIds.length
      ? await db
          .select({
            requestId: issueRequestItems.requestId,
            id: issueRequestItems.id,
            componentId: issueRequestItems.componentId,
            quantity: issueRequestItems.quantity,
            name: components.name,
            category: components.category,
          })
          .from(issueRequestItems)
          .innerJoin(components, eq(issueRequestItems.componentId, components.id))
          .where(inArray(issueRequestItems.requestId, requestIds))
      : [];

    const itemsByRequest = new Map<string, DueDateResponseItem['items']>();

    itemRows.forEach((item) => {
      const existing = itemsByRequest.get(item.requestId) ?? [];
      existing.push({
        id: item.id,
        componentId: item.componentId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
      });
      itemsByRequest.set(item.requestId, existing);
    });

    const data: DueDateResponseItem[] = baseRows.flatMap((row) => {
      if (!row.dueAt) {
        return [];
      }

      const itemNames = (itemsByRequest.get(row.id) ?? []).map((item) => item.name).join(', ');
      const dueDate = new Date(row.dueAt);
      const today = new Date();
      const isOverdue = row.status === 'OVERDUE' || dueDate.getTime() < today.getTime();

      return [
        {
          date: dueDate.toISOString().split('T')[0],
          requestId: row.id,
          label: itemNames || row.purpose,
          isOverdue,
          status: row.status,
          purpose: row.purpose,
          studentName: session.user.role === 'STUDENT' ? undefined : row.studentName,
          items: itemsByRequest.get(row.id) ?? [],
        },
      ];
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/calendar/due-dates]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
