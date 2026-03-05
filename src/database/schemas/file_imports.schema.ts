import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const file_imports = pgTable('file_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  imported_by: uuid('imported_by').notNull(), // Value here is the cognito_sub_id of the logged in user
  import_file: text('import_file').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type FileImport = typeof file_imports.$inferSelect;
export type NewFileImport = typeof file_imports.$inferInsert;
