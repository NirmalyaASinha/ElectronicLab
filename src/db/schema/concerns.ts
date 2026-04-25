import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const concernTargetTypeEnum = pgEnum('concern_target_type', ['FACULTY', 'ALL_FACULTY', 'ADMIN']);
export const concernStatusEnum = pgEnum('concern_status', ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const concerns = pgTable('concerns', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  targetType: concernTargetTypeEnum('target_type').notNull(),
  targetUserId: uuid('target_user_id').references(() => users.id),
  status: concernStatusEnum('status').default('OPEN').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const concernReplies = pgTable('concern_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  concernId: uuid('concern_id').notNull().references(() => concerns.id),
  authorId: uuid('author_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Concern = typeof concerns.$inferSelect;
export type ConcernReply = typeof concernReplies.$inferSelect;
