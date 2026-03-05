import { pgTable, uuid, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { allotmentsFundClusterEnum } from './allotments.schema';

export enum PaymentType {
  CHECK = 'CHECK',
  ADA = 'ADA',
}

export enum PaymentStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SpoilCheckStatus {
  NOT_SPOILED = 'NOT_SPOILED',
  SPOILED = 'SPOILED',
}

export enum BankAccountType {
  REGULAR_AGENCY_LBP_MDS = 'REGULAR_AGENCY_LBP_MDS',
  REGULAR_AGENCY_LBP_DSWD_BIR = 'REGULAR_AGENCY_LBP_DSWD_BIR',
  REGULAR_AGENCY_BTR = 'REGULAR_AGENCY_BTR',
  REGULAR_AGENCY_DSWD_FOV_REFUNDS = 'REGULAR_AGENCY_DSWD_FOV_REFUNDS',
  REGULAR_AGENCY_DSWD_CO_DEPOSITORY = 'REGULAR_AGENCY_DSWD_CO_DEPOSITORY',

  FOREIGN_ASSISTED_LBP_MDS_KALAHI = 'FOREIGN_ASSISTED_LBP_MDS_KALAHI',
  FOREIGN_ASSISTED_LBP_DSWD_FOV_KC = 'FOREIGN_ASSISTED_LBP_DSWD_FOV_KC',
  FOREIGN_ASSISTED_BTR = 'FOREIGN_ASSISTED_BTR',
  FOREIGN_ASSISTED_LBP_MDS_PMNP = 'FOREIGN_ASSISTED_LBP_MDS_PMNP',
  FOREIGN_ASSISTED_LBP_MDS_REGULAR = 'FOREIGN_ASSISTED_LBP_MDS_REGULAR',
  FOREIGN_ASSISTED_LBP_DSWD_BFIRST = 'FOREIGN_ASSISTED_LBP_DSWD_BFIRST',

  SPECIAL_LOCALLY_FUNDED_DSWD_FO5_BCDA = 'SPECIAL_LOCALLY_FUNDED_DSWD_FO5_BCDA',
  SPECIAL_LOCALLY_FUNDED_BTR = 'SPECIAL_LOCALLY_FUNDED_BTR',

  SPECIAL_FOREIGN_ASSISTED_LBP_MDS = 'SPECIAL_FOREIGN_ASSISTED_LBP_MDS',
  SPECIAL_FOREIGN_ASSISTED_BTR = 'SPECIAL_FOREIGN_ASSISTED_BTR',

  INTERNALLY_GENERATED_BTR = 'INTERNALLY_GENERATED_BTR',

  BUSINESS_RELATED_LBP_SEA_RSF = 'BUSINESS_RELATED_LBP_SEA_RSF',
  BUSINESS_RELATED_BTR = 'BUSINESS_RELATED_BTR',

  TRUST_RECEIPTS_LBP_MDS = 'TRUST_RECEIPTS_LBP_MDS',
  TRUST_RECEIPTS_DBP_MISC = 'TRUST_RECEIPTS_DBP_MISC',
  TRUST_RECEIPTS_BTR = 'TRUST_RECEIPTS_BTR',
}

export const paymentTypeEnum = pgEnum('payment_type', [PaymentType.CHECK, PaymentType.ADA]);
export const paymentStatusEnum = pgEnum('payment_status', [
  PaymentStatus.DRAFT,
  PaymentStatus.FOR_TRIAGE,
  PaymentStatus.FOR_PROCESSING,
  PaymentStatus.FOR_PEER_REVIEW,
  PaymentStatus.FOR_APPROVAL,
  PaymentStatus.APPROVED,
  PaymentStatus.REJECTED,
]);
export const spoilCheckStatusEnum = pgEnum('spoil_check_status', [
  SpoilCheckStatus.NOT_SPOILED,
  SpoilCheckStatus.SPOILED,
]);
export const bankAccountTypeEnum = pgEnum('bank_account_type', [
  BankAccountType.REGULAR_AGENCY_LBP_MDS,
  BankAccountType.REGULAR_AGENCY_LBP_DSWD_BIR,
  BankAccountType.REGULAR_AGENCY_BTR,
  BankAccountType.REGULAR_AGENCY_DSWD_FOV_REFUNDS,
  BankAccountType.REGULAR_AGENCY_DSWD_CO_DEPOSITORY,
  BankAccountType.FOREIGN_ASSISTED_LBP_MDS_KALAHI,
  BankAccountType.FOREIGN_ASSISTED_LBP_DSWD_FOV_KC,
  BankAccountType.FOREIGN_ASSISTED_BTR,
  BankAccountType.FOREIGN_ASSISTED_LBP_MDS_PMNP,
  BankAccountType.FOREIGN_ASSISTED_LBP_MDS_REGULAR,
  BankAccountType.FOREIGN_ASSISTED_LBP_DSWD_BFIRST,
  BankAccountType.SPECIAL_LOCALLY_FUNDED_DSWD_FO5_BCDA,
  BankAccountType.SPECIAL_LOCALLY_FUNDED_BTR,
  BankAccountType.SPECIAL_FOREIGN_ASSISTED_LBP_MDS,
  BankAccountType.SPECIAL_FOREIGN_ASSISTED_BTR,
  BankAccountType.INTERNALLY_GENERATED_BTR,
  BankAccountType.BUSINESS_RELATED_LBP_SEA_RSF,
  BankAccountType.BUSINESS_RELATED_BTR,
  BankAccountType.TRUST_RECEIPTS_LBP_MDS,
  BankAccountType.TRUST_RECEIPTS_DBP_MISC,
  BankAccountType.TRUST_RECEIPTS_BTR,
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  fund_cluster: allotmentsFundClusterEnum('fund_cluster'),
  bank_account_no: bankAccountTypeEnum('bank_account_no').notNull(),
  status: paymentStatusEnum('status').notNull(),
  type: paymentTypeEnum('type').notNull(),
  payment_reference_no: text('payment_reference_no'),
  spoil_check_status: spoilCheckStatusEnum('spoil_check_status').notNull(),
  remarks: text('remarks'),
  workflow_id: uuid('workflow_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
