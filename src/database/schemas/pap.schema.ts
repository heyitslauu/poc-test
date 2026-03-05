import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const paps = pgTable('paps', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 15 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
