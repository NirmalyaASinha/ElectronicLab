import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationTypeEnum = pgEnum('notification_type', [
  'REQUEST_SUBMITTED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'COMPONENTS_ISSUED',
  'DUE_REMINDER',
  'OVERDUE_ALERT',
  'FINE_ISSUED',
  'FINE_WAIVED',
  'RETURN_CONFIRMED',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
