import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { labEntryDevices, labEntrySessions, labEntryTaps, labRfidCards, labs } from '@/db/schema';

const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex');

const sameDigest = (a: string, b: string) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceUid = typeof body.deviceUid === 'string' ? body.deviceUid.trim() : '';
    const deviceSecret = typeof body.deviceSecret === 'string' ? body.deviceSecret.trim() : '';
    const labId = typeof body.labId === 'string' ? body.labId.trim() : '';
    const rfidUid = typeof body.rfidUid === 'string' ? body.rfidUid.trim().toUpperCase() : '';
    const actionInput = typeof body.action === 'string' ? body.action.trim().toUpperCase() : '';
    const rawPayload =
      typeof body.rawPayload === 'string'
        ? body.rawPayload
        : body.rawPayload && typeof body.rawPayload === 'object'
          ? JSON.stringify(body.rawPayload)
          : null;

    if (!deviceUid || !deviceSecret || !labId || !rfidUid) {
      return NextResponse.json({ success: false, error: 'deviceUid, deviceSecret, labId, and rfidUid are required' }, { status: 400 });
    }

    if (actionInput && !['ENTRY', 'EXIT'].includes(actionInput)) {
      return NextResponse.json({ success: false, error: 'action must be ENTRY or EXIT' }, { status: 400 });
    }

    const device = await db.query.labEntryDevices.findFirst({
      where: and(eq(labEntryDevices.deviceUid, deviceUid), eq(labEntryDevices.labId, labId)),
    });

    if (!device || !device.isActive) {
      return NextResponse.json({ success: false, error: 'Device not authorized', result: 'DEVICE_UNAUTHORIZED' }, { status: 403 });
    }

    if (!sameDigest(device.deviceSecretHash, hashSecret(deviceSecret))) {
      return NextResponse.json({ success: false, error: 'Invalid device secret', result: 'DEVICE_UNAUTHORIZED' }, { status: 403 });
    }

    const labRow = await db.query.labs.findFirst({ where: eq(labs.id, labId) });
    if (!labRow) {
      return NextResponse.json({ success: false, error: 'Lab not found' }, { status: 404 });
    }

    const card = await db.query.labRfidCards.findFirst({
      where: eq(labRfidCards.rfidUid, rfidUid),
    });

    if (!card) {
      const tapRow = await db
        .insert(labEntryTaps)
        .values({
          labId,
          deviceId: device.id,
          rfidUid,
          rawPayload,
          processed: true,
          result: 'UNKNOWN_CARD',
        })
        .returning({
          id: labEntryTaps.id,
        });

      await db
        .update(labEntryDevices)
        .set({ lastSeenAt: new Date(), updatedAt: new Date() })
        .where(eq(labEntryDevices.id, device.id));

      return NextResponse.json({
        success: true,
        result: 'UNKNOWN_CARD',
        tapId: tapRow[0].id,
      });
    }

    if (!card.isActive) {
      const tapRow = await db
        .insert(labEntryTaps)
        .values({
          labId,
          deviceId: device.id,
          rfidUid,
          rawPayload,
          processed: true,
          result: 'INACTIVE_CARD',
        })
        .returning({
          id: labEntryTaps.id,
        });

      await db
        .update(labEntryDevices)
        .set({ lastSeenAt: new Date(), updatedAt: new Date() })
        .where(eq(labEntryDevices.id, device.id));

      return NextResponse.json({
        success: true,
        result: 'INACTIVE_CARD',
        tapId: tapRow[0].id,
      });
    }

    const recentTaps = await db
      .select({
        id: labEntryTaps.id,
        result: labEntryTaps.result,
        tappedAt: labEntryTaps.tappedAt,
      })
      .from(labEntryTaps)
      .where(
        and(
          eq(labEntryTaps.labId, labId),
          eq(labEntryTaps.rfidUid, rfidUid),
          gte(labEntryTaps.tappedAt, new Date(Date.now() - 5000))
        )
      )
      .orderBy(desc(labEntryTaps.tappedAt))
      .limit(1);

    const recentTap = recentTaps[0];

    if (recentTap) {
      return NextResponse.json({
        success: true,
        result: recentTap.result ?? 'DUPLICATE_TAP',
        duplicate: true,
      });
    }

    const openSession = await db.query.labEntrySessions.findFirst({
      where: and(
        eq(labEntrySessions.labId, labId),
        eq(labEntrySessions.studentId, card.studentId),
        isNull(labEntrySessions.exitAt)
      ),
    });

    const action = actionInput || (openSession ? 'EXIT' : 'ENTRY');

    if (action === 'ENTRY' && openSession) {
      return NextResponse.json({
        success: false,
        error: 'Student is already inside the lab',
        result: 'DUPLICATE_TAP',
      }, { status: 409 });
    }

    if (action === 'EXIT' && !openSession) {
      return NextResponse.json({
        success: false,
        error: 'No open lab session found for exit',
        result: 'DUPLICATE_TAP',
      }, { status: 409 });
    }

    let result: 'ENTRY_CREATED' | 'EXIT_MARKED' = action === 'ENTRY' ? 'ENTRY_CREATED' : 'EXIT_MARKED';
    const tapSignature = createHash('sha256')
      .update(`${labId}:${device.id}:${rfidUid}:${Math.floor(Date.now() / 5000)}`)
      .digest('hex');

    let tapRow: Array<{ id: string; tappedAt: Date }> | undefined;
    try {
      tapRow = await db
        .insert(labEntryTaps)
        .values({
          labId,
          deviceId: device.id,
          rfidUid,
          tapSignature,
          action: action as 'ENTRY' | 'EXIT',
          rawPayload,
          processed: false,
        })
        .returning({
          id: labEntryTaps.id,
          tappedAt: labEntryTaps.tappedAt,
        });
    } catch (insertError) {
      if (insertError instanceof Error && 'code' in insertError && (insertError as { code?: string }).code === '23505') {
        const existingTap = await db
          .select({
            id: labEntryTaps.id,
            tappedAt: labEntryTaps.tappedAt,
            result: labEntryTaps.result,
          })
          .from(labEntryTaps)
          .where(eq(labEntryTaps.tapSignature, tapSignature))
          .orderBy(desc(labEntryTaps.tappedAt))
          .limit(1);

        if (existingTap[0]) {
          return NextResponse.json({
            success: true,
            result: existingTap[0].result ?? 'DUPLICATE_TAP',
            duplicate: true,
            tapId: existingTap[0].id,
          });
        }
      }

      throw insertError;
    }

    if (!tapRow?.[0]) {
      return NextResponse.json({ success: false, error: 'Could not create tap record' }, { status: 500 });
    }

    if (action === 'ENTRY') {
      await db.insert(labEntrySessions).values({
        labId,
        studentId: card.studentId,
        rfidCardId: card.id,
        entryDeviceId: device.id,
        entryTapId: tapRow[0].id,
        entryAt: tapRow[0].tappedAt,
        status: 'INSIDE',
      });
    } else {
      await db
        .update(labEntrySessions)
        .set({
          exitAt: tapRow[0].tappedAt,
          exitDeviceId: device.id,
          exitTapId: tapRow[0].id,
          status: 'COMPLETED',
          updatedAt: new Date(),
        })
        .where(eq(labEntrySessions.id, openSession.id));
    }

    await db
      .update(labEntryTaps)
      .set({ processed: true, result })
      .where(eq(labEntryTaps.id, tapRow[0].id));

    await db
      .update(labEntryDevices)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(labEntryDevices.id, device.id));

    return NextResponse.json({
      success: true,
      result,
      action,
      tapId: tapRow[0].id,
    });
  } catch (error) {
    console.error('[POST /api/lab-entry/tap]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
