import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, bigint, pgEnum } from 'drizzle-orm/pg-core';
import { payees } from './payees.schema';
import { disbursements } from './disbursements.schema';
import { obligationDetails } from './obligation-details.schema';
import { revisedChartOfAccounts, rcaSubObjects } from './rca.schema';

export enum JournalEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export const journalEntryTypeEnum = pgEnum('journal_entry_type', [JournalEntryType.DEBIT, JournalEntryType.CREDIT]);

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  payee_id: uuid('payee_id')
    .notNull()
    .references(() => payees.id),
  disbursement_id: uuid('disbursement_id')
    .notNull()
    .references(() => disbursements.id),
  obligation_detail_id: uuid('obligation_detail_id').references(() => obligationDetails.id),
  rca_id: uuid('rca_id')
    .notNull()
    .references(() => revisedChartOfAccounts.id),
  rca_sub_object_id: uuid('rca_sub_object_id').references(() => rcaSubObjects.id),
  entry_type: journalEntryTypeEnum('entry_type').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type NewJournalEntry = InferInsertModel<typeof journalEntries>;
