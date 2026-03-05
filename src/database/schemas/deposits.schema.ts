import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { allotmentsFundClusterEnum } from './allotments.schema';
import { bankAccountTypeEnum } from './payments.schema';

export enum DepositStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const depositStatusEnum = pgEnum('deposit_status', [
  DepositStatus.DRAFT,
  DepositStatus.FOR_TRIAGE,
  DepositStatus.FOR_PROCESSING,
  DepositStatus.FOR_PEER_REVIEW,
  DepositStatus.FOR_APPROVAL,
  DepositStatus.APPROVED,
  DepositStatus.REJECTED,
]);

export const deposits = pgTable('deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  fund_cluster: allotmentsFundClusterEnum('fund_cluster').notNull(),
  date: timestamp('date').notNull(),
  bank_account_no: bankAccountTypeEnum('bank_account_no').notNull(),
  deposit_no: text('deposit_no').notNull(),
  status: depositStatusEnum('status').notNull().default(DepositStatus.DRAFT),
  remarks: text('remarks'),
  workflow_id: uuid('workflow_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Deposit = InferSelectModel<typeof deposits>;
export type NewDeposit = InferInsertModel<typeof deposits>;
