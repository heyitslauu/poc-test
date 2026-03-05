import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, bigint } from 'drizzle-orm/pg-core';
import { obligations } from './obligations.schema';
import { allotmentDetails } from './allotment-details.schema';

export const obligationDetails = pgTable('obligation_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  obligation_id: uuid('obligation_id')
    .notNull()
    .references(() => obligations.id),
  allotment_details_id: uuid('allotment_details_id').references(() => allotmentDetails.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ObligationDetail = InferSelectModel<typeof obligationDetails>;
export type NewObligationDetail = InferInsertModel<typeof obligationDetails>;
