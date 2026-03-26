import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const otps = pgTable('otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type OTP = typeof otps.$inferSelect;
export type NewOTP = typeof otps.$inferInsert;
