import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { allotmentsFundClusterEnum } from './allotments.schema';
import { payees } from './payees.schema';

export enum CollectionSpoiledStatus {
  SPOILED = 'SPOILED',
  NOT_SPOILED = 'NOT_SPOILED',
}

export enum CollectionStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CollectionType {
  COL002 = 'COL002', // Collection of Service Income
  COL003 = 'COL003', // Collection of Business Income
  COL006 = 'COL006', // Receipt of Funding Check
  COL010 = 'COL010', // Collection from Inter Agency Receivables
  COL026 = 'COL026', // Receipt of Funds for Specific Purpose
  COL028 = 'COL028', // Receipt of Guaranty/Customer's Deposits/Bail Bonds
  COL030 = 'COL030', // Collection of Overpayment of Personal Services Deducted - Unbilled
  COL031 = 'COL031', // Collection of Overpayment of Expenses - Unbilled
  COL032 = 'COL032', // Collection of Overpayment of Expenses for Prior Years - Unbilled
  COL034 = 'COL034', // Refund of Cash Advance
  COL035 = 'COL035', // Collection from Audit Disallowances
}

export const collectionSpoiledStatusEnum = pgEnum('collection_spoiled_status', [
  CollectionSpoiledStatus.SPOILED,
  CollectionSpoiledStatus.NOT_SPOILED,
]);

export const collectionTypeEnum = pgEnum('collection_type', [
  CollectionType.COL002,
  CollectionType.COL003,
  CollectionType.COL006,
  CollectionType.COL010,
  CollectionType.COL026,
  CollectionType.COL028,
  CollectionType.COL030,
  CollectionType.COL031,
  CollectionType.COL032,
  CollectionType.COL034,
  CollectionType.COL035,
]);

export const collectionStatusEnum = pgEnum('collection_status', [
  CollectionStatus.DRAFT,
  CollectionStatus.FOR_TRIAGE,
  CollectionStatus.FOR_PROCESSING,
  CollectionStatus.FOR_PEER_REVIEW,
  CollectionStatus.FOR_APPROVAL,
  CollectionStatus.APPROVED,
  CollectionStatus.REJECTED,
]);

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  fund_cluster: allotmentsFundClusterEnum('fund_cluster').notNull(),
  or_number: text('or_number').notNull(),
  date: timestamp('date').notNull(),
  status: collectionStatusEnum('status').notNull().default(CollectionStatus.DRAFT),
  payor_id: uuid('payor_id')
    .notNull()
    .references(() => payees.id),
  collection_type: collectionTypeEnum('collection_type').notNull(),
  particulars: text('particulars').notNull(),
  remarks: text('remarks'),
  spoiled: collectionSpoiledStatusEnum('spoiled').notNull(),
  workflow_id: uuid('workflow_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Collection = InferSelectModel<typeof collections>;
export type NewCollection = InferInsertModel<typeof collections>;
