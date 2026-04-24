import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const labAccessRequestStatusEnum = pgEnum('lab_access_request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const labAccessHistoryStatusEnum = pgEnum('lab_access_history_status', [
  'ACTIVE',
  'COMPLETED',
  'REVOKED',
  'NO_SHOW',
]);

export const labs = pgTable('labs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location'),
  responsibleFacultyId: uuid('responsible_faculty_id')
    .notNull()
    .references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const labAccessRequests = pgTable('lab_access_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  labId: uuid('lab_id')
    .notNull()
    .references(() => labs.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id),
  reason: text('reason').notNull(),
  requestedFor: timestamp('requested_for').notNull(),
  durationMinutes: integer('duration_minutes').default(120).notNull(),
  status: labAccessRequestStatusEnum('status').default('PENDING').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  decisionNote: text('decision_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const labAccessHistory = pgTable('lab_access_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => labAccessRequests.id),
  labId: uuid('lab_id')
    .notNull()
    .references(() => labs.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id),
  facultyId: uuid('faculty_id')
    .notNull()
    .references(() => users.id),
  accessReason: text('access_reason').notNull(),
  status: labAccessHistoryStatusEnum('status').default('ACTIVE').notNull(),
  accessGrantedAt: timestamp('access_granted_at').defaultNow().notNull(),
  accessEndedAt: timestamp('access_ended_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Lab = typeof labs.$inferSelect;
export type LabAccessRequest = typeof labAccessRequests.$inferSelect;
export type LabAccessHistory = typeof labAccessHistory.$inferSelect;