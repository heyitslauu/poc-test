import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { deposits } from './deposits.schema';
import { collections } from './collections.schema';

export const depositCollections = pgTable('deposit_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  deposit_id: uuid('deposit_id')
    .notNull()
    .references(() => deposits.id),
  collection_id: uuid('collection_id')
    .notNull()
    .references(() => collections.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DepositCollection = InferSelectModel<typeof depositCollections>;
export type NewDepositCollection = InferInsertModel<typeof depositCollections>;
