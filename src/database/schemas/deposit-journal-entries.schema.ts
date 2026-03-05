import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, bigint } from 'drizzle-orm/pg-core';
import { deposits } from './deposits.schema';
import { paps } from './pap.schema';
import { revisedChartOfAccounts } from './rca.schema';

export const depositJournalEntries = pgTable('deposit_journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  deposit_id: uuid('deposit_id')
    .notNull()
    .references(() => deposits.id),
  paps_id: uuid('paps_id').references(() => paps.id),
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

export type DepositJournalEntry = InferSelectModel<typeof depositJournalEntries>;
export type NewDepositJournalEntry = InferInsertModel<typeof depositJournalEntries>;
