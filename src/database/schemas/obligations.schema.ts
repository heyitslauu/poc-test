import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { allotmentsFundClusterEnum } from './allotments.schema';
import { payees } from './payees.schema';
import { pgTable, uuid, timestamp, text, pgEnum, varchar, bigint } from 'drizzle-orm/pg-core';

export enum ObligationStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ObligationStatusEnum = pgEnum('status', [
  ObligationStatus.DRAFT,
  ObligationStatus.FOR_TRIAGE,
  ObligationStatus.FOR_PROCESSING,
  ObligationStatus.FOR_PEER_REVIEW,
  ObligationStatus.FOR_APPROVAL,
  ObligationStatus.APPROVED,
  ObligationStatus.REJECTED,
]);

export const obligations = pgTable('obligations', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  payee_id: uuid('payee_id')
    .notNull()
    .references(() => payees.id),
  fund_cluster: allotmentsFundClusterEnum('fund_cluster'),
  ors_number: varchar('ors_number', { length: 150 }).unique(),
  tracking_reference: varchar('tracking_reference', { length: 150 }).notNull().unique(),
  particulars: text('particulars').notNull(),
  date: timestamp('date').notNull(),
  transaction_type: text('transaction_type'),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  status: ObligationStatusEnum('status').notNull(),
  remarks: text('remarks'),
  workflow_id: uuid('workflow_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Obligation = InferSelectModel<typeof obligations>;
export type NewObligation = InferInsertModel<typeof obligations>;
