import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, text, pgEnum, varchar } from 'drizzle-orm/pg-core';
import { subAros } from './sub-aro.schema';

export enum WithdrawalStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_FINALIZATION = 'FOR_FINALIZATION',
  REQUEST_FINALIZED = 'REQUEST_FINALIZED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  REQUEST_FOR_REVIEW = 'REQUEST_FOR_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const withdrawalsStatusEnum = pgEnum('status', [
  WithdrawalStatus.DRAFT,
  WithdrawalStatus.FOR_TRIAGE,
  WithdrawalStatus.FOR_PROCESSING,
  WithdrawalStatus.FOR_PEER_REVIEW,
  WithdrawalStatus.FOR_FINALIZATION,
  WithdrawalStatus.REQUEST_FINALIZED,
  WithdrawalStatus.REQUEST_REJECTED,
  WithdrawalStatus.REQUEST_FOR_REVIEW,
  WithdrawalStatus.FOR_APPROVAL,
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.REJECTED,
]);

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  sub_aro_id: uuid('sub_aro_id').references(() => subAros.id),
  withdrawal_code: varchar('withdrawal_code', { length: 150 }).unique(),
  date: timestamp('date').notNull(),
  particulars: text('particulars').notNull(),
  status: withdrawalsStatusEnum('status').notNull(),
  workflow_id: uuid('workflow_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Withdrawal = InferSelectModel<typeof withdrawals>;
export type NewWithdrawal = InferInsertModel<typeof withdrawals>;
