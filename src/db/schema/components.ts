import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const componentStatusEnum = pgEnum('component_status', [
  'AVAILABLE',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'DISCONTINUED',
]);

export const components = pgTable('components', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  modelNumber: text('model_number'),
  quantityTotal: integer('quantity_total').notNull(),
  quantityAvailable: integer('quantity_available').notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
  status: componentStatusEnum('status').default('AVAILABLE').notNull(),
  imageUrl: text('image_url'),
  specs: jsonb('specs'),
  maxIssueDays: integer('max_issue_days').default(7).notNull(),
  maxIssueQuantity: integer('max_issue_quantity').default(5).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
