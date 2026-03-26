import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
