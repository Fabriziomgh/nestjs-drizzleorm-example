import { InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = InferSelectModel<typeof users>;
