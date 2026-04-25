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
  'CONCERN_CREATED',
  'CONCERN_REPLIED',
  'CONCERN_STATUS_UPDATED',
  'PROJECT_CREATED',
  'PROJECT_JOINED',
  'PROJECT_MEMBER_ADDED',
  'PROJECT_UPDATED',
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
