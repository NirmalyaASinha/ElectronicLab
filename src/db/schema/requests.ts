import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { components } from './components';

export const requestStatusEnum = pgEnum('request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'ISSUED',
  'RETURNED',
  'OVERDUE',
]);

export const issueRequests = pgTable('issue_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  facultyId: uuid('faculty_id').references(() => users.id),
  status: requestStatusEnum('status').default('PENDING').notNull(),
  purpose: text('purpose').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  issuedAt: timestamp('issued_at'),
  dueAt: timestamp('due_at'),
  returnedAt: timestamp('returned_at'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const issueRequestItems = pgTable('issue_request_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => issueRequests.id),
  componentId: uuid('component_id')
    .notNull()
    .references(() => components.id),
  quantity: integer('quantity').notNull(),
  returnedQty: integer('returned_qty').default(0).notNull(),
  condition: text('condition'),
});

export type IssueRequest = typeof issueRequests.$inferSelect;
export type IssueRequestItem = typeof issueRequestItems.$inferSelect;
