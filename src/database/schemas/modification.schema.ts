import { InferSelectModel, InferInsertModel, sql } from 'drizzle-orm';
import { allotments } from './allotments.schema';
import { pgTable, uuid, timestamp, text, pgEnum, varchar, check } from 'drizzle-orm/pg-core';
import { subAros } from './sub-aro.schema';

export enum ModificationStatus {
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

export const modificationsStatusEnum = pgEnum('status', [
  ModificationStatus.DRAFT,
  ModificationStatus.FOR_TRIAGE,
  ModificationStatus.FOR_PROCESSING,
  ModificationStatus.FOR_PEER_REVIEW,
  ModificationStatus.FOR_FINALIZATION,
  ModificationStatus.REQUEST_FINALIZED,
  ModificationStatus.REQUEST_REJECTED,
  ModificationStatus.REQUEST_FOR_REVIEW,
  ModificationStatus.FOR_APPROVAL,
  ModificationStatus.APPROVED,
  ModificationStatus.REJECTED,
]);

export const modifications = pgTable(
  'modifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id'),

    allotment_id: uuid('allotment_id').references(() => allotments.id),
    sub_aro_id: uuid('sub_aro_id').references(() => subAros.id),

    modification_code: varchar('modification_code', { length: 150 }).unique(),
    date: timestamp('date').notNull(),
    particulars: text('particulars').notNull(),
    status: modificationsStatusEnum('status').notNull(),
    workflow_id: uuid('workflow_id'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'only_one_reference',
      sql`(${table.allotment_id} IS NOT NULL AND ${table.sub_aro_id} IS NULL) OR (${table.allotment_id} IS NULL AND ${table.sub_aro_id} IS NOT NULL)`,
    ),
  ],
);

export type Modification = InferSelectModel<typeof modifications>;
export type NewModification = InferInsertModel<typeof modifications>;
