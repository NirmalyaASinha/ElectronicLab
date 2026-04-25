import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { components } from './components';

export const projectStatusEnum = pgEnum('project_status', ['ACTIVE', 'PAUSED', 'COMPLETED']);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id),
  status: projectStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const projectMembers = pgTable('project_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').default('MEMBER').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const projectComponents = pgTable('project_components', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  componentId: uuid('component_id').notNull().references(() => components.id),
  assignedTo: uuid('assigned_to').references(() => users.id),
  quantity: integer('quantity').default(1).notNull(),
  checkedOutAt: timestamp('checked_out_at').defaultNow(),
  returnedAt: timestamp('returned_at'),
  isReturned: boolean('is_returned').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type ProjectComponent = typeof projectComponents.$inferSelect;
