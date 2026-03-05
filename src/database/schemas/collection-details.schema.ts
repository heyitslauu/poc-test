import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, bigint } from 'drizzle-orm/pg-core';
import { collections } from './collections.schema';
import { paps } from './pap.schema';
import { payeeTypeEnum } from './payees.schema';
import { payees } from './payees.schema';
import { revisedChartOfAccounts } from './rca.schema';

export const collectionDetails = pgTable('collection_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  collection_id: uuid('collection_id')
    .notNull()
    .references(() => collections.id),
  paps_id: uuid('paps_id').references(() => paps.id),
  payee_type: payeeTypeEnum('payee_type').notNull(),
  payee_id: uuid('payee_id')
    .notNull()
    .references(() => payees.id),
  uacs_id: uuid('uacs_id')
    .notNull()
    .references(() => revisedChartOfAccounts.id),
  debit: bigint('debit', { mode: 'number' }).notNull().default(0),
  credit: bigint('credit', { mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CollectionDetail = InferSelectModel<typeof collectionDetails>;
export type NewCollectionDetail = InferInsertModel<typeof collectionDetails>;
