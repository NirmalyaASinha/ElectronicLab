import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { issueRequests, issueRequestItems } from './requests';

export const fineStatusEnum = pgEnum('fine_status', [
  'PENDING',
  'PAID',
  'WAIVED',
]);
export const fineReasonEnum = pgEnum('fine_reason', [
  'OVERDUE',
  'DAMAGED',
  'LOST',
]);

export const fines = pgTable('fines', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id),
  requestId: uuid('request_id')
    .notNull()
    .references(() => issueRequests.id),
  itemId: uuid('item_id').references(() => issueRequestItems.id),
  reason: fineReasonEnum('reason').notNull(),
  amount: integer('amount').notNull(),
  daysOverdue: integer('days_overdue'),
  status: fineStatusEnum('status').default('PENDING').notNull(),
  issuedBy: uuid('issued_by').references(() => users.id),
  waivedBy: uuid('waived_by').references(() => users.id),
  waivedReason: text('waived_reason'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Fine = typeof fines.$inferSelect;
