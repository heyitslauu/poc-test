import { InferSelectModel, InferInsertModel, sql } from 'drizzle-orm';
import { pgTable, uuid, timestamp, pgEnum, bigint, text, check } from 'drizzle-orm/pg-core';
import { FundCluster } from './allotments.schema';
import { payees } from './payees.schema';
export enum DisbursementStatus {
  DRAFT = 'DRAFT',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  RECEIVED = 'RECEIVED',
}

export const disbursementsStatusEnum = pgEnum('disbursement_status', [
  DisbursementStatus.DRAFT,
  DisbursementStatus.FOR_PROCESSING,
  DisbursementStatus.FOR_PEER_REVIEW,
  DisbursementStatus.FOR_APPROVAL,
  DisbursementStatus.APPROVED,
  DisbursementStatus.PAID,
  DisbursementStatus.CANCELLED,
  DisbursementStatus.REJECTED,
  DisbursementStatus.RECEIVED,
]);

export const disbursementsFundClusterEnum = pgEnum('disbursement_fund_cluster', [
  FundCluster.REGULAR_AGENCY_FUND,
  FundCluster.FOREIGN_ASSISTED_PROJECTS_FUND,
  FundCluster.SPECIAL_ACCOUNT_LOCALLY_FUNDED_DOMESTIC_GRANTS_FUND,
  FundCluster.SPECIAL_ACCOUNT_FOREIGN_ASSISTED_FOREIGN_GRANTS_FUND,
  FundCluster.INTERNALLY_GENERATED_FUNDS,
  FundCluster.BUSINESS_RELATED_FUNDS,
  FundCluster.TRUST_RECEIPTS,
]);

export const disbursements = pgTable(
  'disbursements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    payee_id: uuid('payee_id')
      .notNull()
      .references(() => payees.id),
    fund_cluster: disbursementsFundClusterEnum('fund_cluster'),
    dv_number: text('dv_number').unique(),
    tracking_reference: text('tracking_reference').unique(),
    particulars: text('particulars'),
    date: timestamp('date'),
    transaction_type: text('transaction_type'),
    amount: bigint('amount', { mode: 'number' }),
    status: disbursementsStatusEnum('status').notNull(),
    remarks: text('remarks'),
    workflow_id: uuid('workflow_id'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'required_fields_when_not_draft',
      sql`(status = 'DRAFT') OR (
      ${table.fund_cluster} IS NOT NULL AND
      ${table.tracking_reference} IS NOT NULL AND
      ${table.particulars} IS NOT NULL AND
      ${table.date} IS NOT NULL AND
      ${table.transaction_type} IS NOT NULL AND
      ${table.amount} IS NOT NULL
    )`,
    ),
  ],
);

export type Disbursement = InferSelectModel<typeof disbursements>;
export type NewDisbursement = InferInsertModel<typeof disbursements>;
