import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { issueRequests, issueRequestItems, components as componentsSchema } from '@/db/schema';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });

  const projectId = params.id;

  try {
    const rows = await db.query.projectComponents.findMany({
      where: (pc, { eq }) => eq(pc.projectId, projectId),
      columns: {
        id: true,
        projectId: true,
        componentId: true,
        assignedTo: true,
        quantity: true,
        checkedOutAt: true,
        returnedAt: true,
        isReturned: true,
        notes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });

  const projectId = params.id;
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { componentId, quantity = 1, notes = '', createRequest = false } = body;

    // Verify membership
    const member = await db.query.projectMembers.findFirst({ where: (pm, { eq }) => eq(pm.projectId, projectId) && eq(pm.userId, userId) });
    if (!member && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Not a project member' }, { status: 403 });
    }

    // Validate component availability
    const comp = await db.query.components.findFirst({ where: (c, { eq }) => eq(c.id, componentId) });
    if (!comp) return NextResponse.json({ success: false, error: 'Component not found' }, { status: 404 });
    if ((comp.quantityAvailable ?? 0) < quantity) {
      return NextResponse.json({ success: false, error: 'Insufficient quantity available' }, { status: 400 });
    }
    if (comp.maxIssueQuantity && quantity > comp.maxIssueQuantity) {
      return NextResponse.json({ success: false, error: `Max issue quantity is ${comp.maxIssueQuantity}` }, { status: 400 });
    }

    // perform insert and decrement availability
    const inserted = await db.insert('project_components').values({ project_id: projectId, component_id: componentId, assigned_to: userId, quantity, notes }).returning('*');
    await db.update(componentsSchema).set({ quantityAvailable: (comp.quantityAvailable ?? 0) - quantity }).where((c, { eq }) => eq(c.id, componentId));

    let createdRequest: any = null;
    if (createRequest) {
      // create an issue_request and an item so the checkout appears in the normal requests flow
      const req = await db.insert(issueRequests).values({
        studentId: userId,
        facultyId: null,
        status: 'ISSUED',
        purpose: `Project checkout (${projectId})`,
        issuedAt: new Date().toISOString(),
      }).returning('*');

      const requestId = Array.isArray(req) ? req[0].id : (req as any).id;

      await db.insert(issueRequestItems).values({ request_id: requestId, component_id: componentId, quantity }).returning('*');
      createdRequest = requestId;
    }

    return NextResponse.json({ success: true, data: inserted, createdRequest });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
