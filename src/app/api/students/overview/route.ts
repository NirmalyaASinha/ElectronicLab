import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { components, issueRequestItems, issueRequests, users, fines } from '@/db/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'FACULTY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        department: users.department,
        rollNumber: users.rollNumber,
        semester: users.semester,
      })
      .from(users)
      .where(eq(users.role, 'STUDENT'))
      .orderBy(asc(users.name));

    const studentIds = students.map((student) => student.id);

    const requests = studentIds.length
      ? await db
          .select({
            id: issueRequests.id,
            studentId: issueRequests.studentId,
            facultyId: issueRequests.facultyId,
            status: issueRequests.status,
            purpose: issueRequests.purpose,
            requestedAt: issueRequests.requestedAt,
            approvedAt: issueRequests.approvedAt,
            issuedAt: issueRequests.issuedAt,
            dueAt: issueRequests.dueAt,
            returnedAt: issueRequests.returnedAt,
            rejectionReason: issueRequests.rejectionReason,
            facultyName: users.name,
          })
          .from(issueRequests)
          .leftJoin(users, eq(issueRequests.facultyId, users.id))
          .where(inArray(issueRequests.studentId, studentIds))
          .orderBy(desc(issueRequests.createdAt))
      : [];

    const requestIds = requests.map((request) => request.id);

    const requestItems = requestIds.length
      ? await db
          .select({
            requestId: issueRequestItems.requestId,
            id: issueRequestItems.id,
            componentId: issueRequestItems.componentId,
            quantity: issueRequestItems.quantity,
            returnedQty: issueRequestItems.returnedQty,
            componentName: components.name,
            category: components.category,
          })
          .from(issueRequestItems)
          .innerJoin(components, eq(issueRequestItems.componentId, components.id))
          .where(inArray(issueRequestItems.requestId, requestIds))
      : [];

    const requestFines = requestIds.length
      ? await db
          .select({
            requestId: fines.requestId,
            amount: fines.amount,
            status: fines.status,
            reason: fines.reason,
          })
          .from(fines)
          .where(and(inArray(fines.requestId, requestIds)))
      : [];

    const itemsByRequest = new Map<string, typeof requestItems>();
    requestItems.forEach((item) => {
      const existing = itemsByRequest.get(item.requestId) ?? [];
      existing.push(item);
      itemsByRequest.set(item.requestId, existing);
    });

    const finesByRequest = new Map<string, typeof requestFines>();
    requestFines.forEach((fine) => {
      const existing = finesByRequest.get(fine.requestId) ?? [];
      existing.push(fine);
      finesByRequest.set(fine.requestId, existing);
    });

    const data = students.map((student) => {
      const studentRequests = requests.filter((request) => request.studentId === student.id).map((request) => ({
        ...request,
        items: itemsByRequest.get(request.id) ?? [],
        fines: finesByRequest.get(request.id) ?? [],
      }));

      return {
        ...student,
        requestCount: studentRequests.length,
        activeRequestCount: studentRequests.filter((request) => request.status === 'ISSUED' || request.status === 'OVERDUE').length,
        requests: studentRequests,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/students/overview]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}