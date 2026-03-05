import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const revisedChartOfAccounts = pgTable('revised_chart_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  allows_sub_object: boolean('allows_sub_object').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const rcaSubObjects = pgTable('rca_sub_objects', {
  id: uuid('id').primaryKey().defaultRandom(),
  rca_id: uuid('rca_id')
    .notNull()
    .references(() => revisedChartOfAccounts.id),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
