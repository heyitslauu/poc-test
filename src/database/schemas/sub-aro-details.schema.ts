import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { subAros } from './sub-aro.schema';
import { allotmentDetails } from './allotment-details.schema';
import { pgTable, uuid, timestamp, bigint } from 'drizzle-orm/pg-core';

export const subAroDetails = pgTable('sub_aro_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  sub_aro_id: uuid('sub_aro_id')
    .notNull()
    .references(() => subAros.id),

  uacs_id: uuid('uacs_id')
    .notNull()
    .references(() => allotmentDetails.id),

  amount: bigint('amount', { mode: 'number' }).notNull(),

  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SubAroDetail = InferSelectModel<typeof subAroDetails>;
export type NewSubAroDetail = InferInsertModel<typeof subAroDetails>;
