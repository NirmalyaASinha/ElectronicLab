import {
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { components } from './components';

export const projectVisibilityEnum = pgEnum('project_visibility', ['PRIVATE', 'OPEN']);
export const projectStatusEnum = pgEnum('project_status', ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED']);
export const projectMemberRoleEnum = pgEnum('project_member_role', ['OWNER', 'MEMBER']);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').default('').notNull(),
  visibility: projectVisibilityEnum('visibility').default('PRIVATE').notNull(),
  status: projectStatusEnum('status').default('PLANNING').notNull(),
  progress: integer('progress').default(0).notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectMembers = pgTable('project_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: projectMemberRoleEnum('role').default('MEMBER').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  projectUserUnique: uniqueIndex('project_members_project_user_unique').on(table.projectId, table.userId),
}));

export const projectComponents = pgTable('project_components', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  componentId: uuid('component_id').notNull().references(() => components.id),
  quantity: integer('quantity').default(1).notNull(),
  notes: text('notes'),
  addedBy: uuid('added_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type ProjectComponent = typeof projectComponents.$inferSelect;
