import { InferSelectModel, InferInsertModel, relations } from 'drizzle-orm';
import { pgTable, uuid, bigint, timestamp } from 'drizzle-orm/pg-core';
import { payments } from './payments.schema';
import { journalEntries } from './journal-entries.schema';
import { payees } from './payees.schema';

export const paymentDetails = pgTable('payment_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  payment_id: uuid('payment_id')
    .notNull()
    .references(() => payments.id),
  journal_entry_id: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id),
  payee_id: uuid('payee_id')
    .notNull()
    .references(() => payees.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const paymentDetailsRelations = relations(paymentDetails, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentDetails.payment_id],
    references: [payments.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [paymentDetails.journal_entry_id],
    references: [journalEntries.id],
  }),
  payee: one(payees, {
    fields: [paymentDetails.payee_id],
    references: [payees.id],
  }),
}));

export type PaymentDetail = InferSelectModel<typeof paymentDetails>;
export type NewPaymentDetail = InferInsertModel<typeof paymentDetails>;
