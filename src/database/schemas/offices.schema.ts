import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const fieldOffices = pgTable('field_offices', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  office_key: varchar('office_key', { length: 100 }).unique(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
