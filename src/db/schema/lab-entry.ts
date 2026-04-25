import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { labs } from './lab-access';
import { users } from './users';

export const labEntrySessionStatusEnum = pgEnum('lab_entry_session_status', [
  'INSIDE',
  'COMPLETED',
  'REVOKED',
  'NO_SHOW',
]);

export const labEntryTapResultEnum = pgEnum('lab_entry_tap_result', [
  'ENTRY_CREATED',
  'EXIT_MARKED',
  'UNKNOWN_CARD',
  'INACTIVE_CARD',
  'DEVICE_UNAUTHORIZED',
  'LAB_MISMATCH',
  'DUPLICATE_TAP',
]);

export const labEntryActionEnum = pgEnum('lab_entry_action', [
  'ENTRY',
  'EXIT',
]);

export const labRfidCards = pgTable('lab_rfid_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfidUid: text('rfid_uid').notNull().unique(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  isActive: boolean('is_active').default(true).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  notes: text('notes'),
});

export const labEntryDevices = pgTable('lab_entry_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  labId: uuid('lab_id')
    .notNull()
    .references(() => labs.id),
  deviceUid: text('device_uid').notNull().unique(),
  deviceSecretHash: text('device_secret_hash').notNull(),
  label: text('label'),
  isActive: boolean('is_active').default(true).notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const labEntrySessions = pgTable('lab_entry_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  labId: uuid('lab_id')
    .notNull()
    .references(() => labs.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id),
  rfidCardId: uuid('rfid_card_id')
    .notNull()
    .references(() => labRfidCards.id),
  entryDeviceId: uuid('entry_device_id').references(() => labEntryDevices.id),
  exitDeviceId: uuid('exit_device_id').references(() => labEntryDevices.id),
  entryTapId: uuid('entry_tap_id'),
  exitTapId: uuid('exit_tap_id'),
  entryAt: timestamp('entry_at').defaultNow().notNull(),
  exitAt: timestamp('exit_at'),
  status: labEntrySessionStatusEnum('status').default('INSIDE').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const labEntryTaps = pgTable('lab_entry_taps', {
  id: uuid('id').defaultRandom().primaryKey(),
  labId: uuid('lab_id')
    .notNull()
    .references(() => labs.id),
  deviceId: uuid('device_id').references(() => labEntryDevices.id),
  rfidUid: text('rfid_uid').notNull(),
  tapSignature: text('tap_signature'),
  action: labEntryActionEnum('action').notNull(),
  tappedAt: timestamp('tapped_at').defaultNow().notNull(),
  rawPayload: text('raw_payload'),
  processed: boolean('processed').default(false).notNull(),
  result: labEntryTapResultEnum('result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type LabRfidCard = typeof labRfidCards.$inferSelect;
export type LabEntryDevice = typeof labEntryDevices.$inferSelect;
export type LabEntrySession = typeof labEntrySessions.$inferSelect;
export type LabEntryTap = typeof labEntryTaps.$inferSelect;
