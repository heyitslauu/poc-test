import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, text, boolean, varchar } from 'drizzle-orm/pg-core';

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  employee_number: varchar('employee_number', { length: 20 }),
  first_name: text('first_name').notNull(),
  middle_name: text('middle_name'),
  last_name: text('last_name').notNull(),
  extension_name: text('extension_name'),
  is_active: boolean('is_active').notNull().default(true),
});

export type Employee = InferSelectModel<typeof employees>;
export type NewEmployee = InferInsertModel<typeof employees>;
