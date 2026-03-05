import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { withdrawals } from './withdrawals.schema';
import { pgTable, uuid, timestamp, bigint } from 'drizzle-orm/pg-core';
import { subAroDetails } from './sub-aro-details.schema';

export const withdrawalDetails = pgTable('withdrawal_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  withdrawal_id: uuid('withdrawal_id')
    .notNull()
    .references(() => withdrawals.id),
  sub_aro_details_id: uuid('sub_aro_details_id').references(() => subAroDetails.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type WithdrawalDetail = InferSelectModel<typeof withdrawalDetails>;
export type NewWithdrawalDetail = InferInsertModel<typeof withdrawalDetails>;
