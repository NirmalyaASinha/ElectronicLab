import { randomBytes, createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { labEntryDevices, labs } from '@/db/schema';

const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const labId = typeof body.labId === 'string' ? body.labId.trim() : '';
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const deviceUid = typeof body.deviceUid === 'string' && body.deviceUid.trim() ? body.deviceUid.trim() : `device-${randomBytes(6).toString('hex')}`;

    if (!labId) {
      return NextResponse.json({ success: false, error: 'Lab is required' }, { status: 400 });
    }

    const labRow = await db.query.labs.findFirst({ where: eq(labs.id, labId) });
    if (!labRow) {
      return NextResponse.json({ success: false, error: 'Lab not found' }, { status: 404 });
    }

    const deviceSecret = randomBytes(24).toString('base64url');
    const secretHash = hashSecret(deviceSecret);

    const created = await db
      .insert(labEntryDevices)
      .values({
        labId,
        deviceUid,
        deviceSecretHash: secretHash,
        label: label || null,
        isActive: true,
      })
      .returning({
        id: labEntryDevices.id,
        labId: labEntryDevices.labId,
        deviceUid: labEntryDevices.deviceUid,
        label: labEntryDevices.label,
        isActive: labEntryDevices.isActive,
        createdAt: labEntryDevices.createdAt,
      });

    return NextResponse.json({
      success: true,
      data: {
        ...created[0],
        deviceSecret,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/lab-entry/devices]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const whereClause =
      session.user.role === 'ADMIN'
        ? undefined
        : eq(labs.responsibleFacultyId, session.user.id);

    const rows = await db
      .select({
        id: labEntryDevices.id,
        labId: labEntryDevices.labId,
        deviceUid: labEntryDevices.deviceUid,
        label: labEntryDevices.label,
        isActive: labEntryDevices.isActive,
        lastSeenAt: labEntryDevices.lastSeenAt,
        createdAt: labEntryDevices.createdAt,
      })
      .from(labEntryDevices)
      .innerJoin(labs, eq(labEntryDevices.labId, labs.id))
      .where(whereClause);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /api/lab-entry/devices]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
