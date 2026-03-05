import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, bigint } from 'drizzle-orm/pg-core';
import { earmarks } from './earmarks.schema';
import { allotmentDetails } from './allotment-details.schema';

export const earmarkDetails = pgTable('earmark_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),

  earmark_id: uuid('earmark_id')
    .notNull()
    .references(() => earmarks.id),
  allotment_details_id: uuid('allotment_details_id')
    .references(() => allotmentDetails.id)
    .notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),

  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type EarmarkDetail = InferSelectModel<typeof earmarkDetails>;
export type NewEarmarkDetail = InferInsertModel<typeof earmarkDetails>;
