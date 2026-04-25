import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users, userRoleEnum } from './users';

export const information = pgTable('information', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  authorRole: userRoleEnum('author_role').notNull(),
  pinned: boolean('pinned').default(false).notNull(),
  visibleFrom: timestamp('visible_from'),
  visibleUntil: timestamp('visible_until'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Information = typeof information.$inferSelect;
