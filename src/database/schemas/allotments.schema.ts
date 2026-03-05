import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, pgEnum, bigint, text } from 'drizzle-orm/pg-core';

export enum FundCluster {
  REGULAR_AGENCY_FUND = '01',
  FOREIGN_ASSISTED_PROJECTS_FUND = '02',
  SPECIAL_ACCOUNT_LOCALLY_FUNDED_DOMESTIC_GRANTS_FUND = '03',
  SPECIAL_ACCOUNT_FOREIGN_ASSISTED_FOREIGN_GRANTS_FUND = '04',
  INTERNALLY_GENERATED_FUNDS = '05',
  BUSINESS_RELATED_FUNDS = '06',
  TRUST_RECEIPTS = '07',
}

export const allotmentsFundClusterEnum = pgEnum('fund_cluster', [
  FundCluster.REGULAR_AGENCY_FUND,
  FundCluster.FOREIGN_ASSISTED_PROJECTS_FUND,
  FundCluster.SPECIAL_ACCOUNT_LOCALLY_FUNDED_DOMESTIC_GRANTS_FUND,
  FundCluster.SPECIAL_ACCOUNT_FOREIGN_ASSISTED_FOREIGN_GRANTS_FUND,
  FundCluster.INTERNALLY_GENERATED_FUNDS,
  FundCluster.BUSINESS_RELATED_FUNDS,
  FundCluster.TRUST_RECEIPTS,
]);

export enum AppropriationType {
  CURRENT_APPROPRIATION = 'CURRENT_APPROPRIATION',
  CONTINUING_APPROPRIATION_CO = 'CONTINUING_APPROPRIATION_CO',
  CONTINUING_APPROPRIATION_FO = 'CONTINUING_APPROPRIATION_FO',
}

export const allotmentsAppropriationTypeEnum = pgEnum('appropriation_type', [
  AppropriationType.CURRENT_APPROPRIATION,
  AppropriationType.CONTINUING_APPROPRIATION_CO,
  AppropriationType.CONTINUING_APPROPRIATION_FO,
]);

export enum BfarsBudgetType {
  AGENCY_SPECIFIC_BUDGET = 'AGENCY_SPECIFIC_BUDGET',
  AUTOMATIC_APPROPRIATIONS = 'AUTOMATIC_APPROPRIATIONS',
  SPECIAL_PURPOSE_FUNDS = 'SPECIAL_PURPOSE_FUNDS',
}

export const allotmentsBfarsBudgetTypeEnum = pgEnum('bfars_budget_type', [
  BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
  BfarsBudgetType.AUTOMATIC_APPROPRIATIONS,
  BfarsBudgetType.SPECIAL_PURPOSE_FUNDS,
]);

export enum AllotmentType {
  DIRECT_RELEASE = 'DIRECT_RELEASE',
  CENTRALLY_MANAGED_FUND = 'CENTRALLY_MANAGED_FUND',
}

export const allotmentsAllotmentTypeEnum = pgEnum('allotment_type', [
  AllotmentType.DIRECT_RELEASE,
  AllotmentType.CENTRALLY_MANAGED_FUND,
]);

export enum AllotmentStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const allotmentsStatusEnum = pgEnum('status', [
  AllotmentStatus.DRAFT,
  AllotmentStatus.FOR_TRIAGE,
  AllotmentStatus.FOR_PROCESSING,
  AllotmentStatus.FOR_PEER_REVIEW,
  AllotmentStatus.FOR_APPROVAL,
  AllotmentStatus.APPROVED,
  AllotmentStatus.REJECTED,
]);

export const allotments = pgTable('allotments', {
  id: uuid('id').primaryKey().defaultRandom(),
  allotment_code: text('allotment_code').unique(),
  user_id: uuid('user_id').notNull(),
  tracking_reference: text('tracking_reference').notNull().unique(),
  date: timestamp('date').notNull(),
  fund_cluster: allotmentsFundClusterEnum('fund_cluster'),
  particulars: text('particulars').notNull(),
  appropriation_type: allotmentsAppropriationTypeEnum('appropriation_type'),
  bfars_budget_type: allotmentsBfarsBudgetTypeEnum('bfars_budget_type'),
  allotment_type: allotmentsAllotmentTypeEnum('allotment_type'),
  total_allotment: bigint('total_allotment', { mode: 'number' }).notNull(),
  workflow_id: uuid('workflow_id'),
  status: allotmentsStatusEnum('status').notNull(),
  remarks: text('remarks'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Allotment = InferSelectModel<typeof allotments>;
export type NewAllotment = InferInsertModel<typeof allotments>;
