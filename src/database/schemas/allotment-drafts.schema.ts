import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp, bigint, text } from 'drizzle-orm/pg-core';
import {
  allotmentsFundClusterEnum,
  allotmentsAppropriationTypeEnum,
  allotmentsBfarsBudgetTypeEnum,
  allotmentsAllotmentTypeEnum,
  allotments,
} from './allotments.schema';

export const allotmentDrafts = pgTable('allotment_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  target_allotment_id: uuid('target_allotment_id').references(() => allotments.id),
  date: timestamp('date'),
  fund_cluster: allotmentsFundClusterEnum('fund_cluster'),
  particulars: text('particulars'),
  appropriation_type: allotmentsAppropriationTypeEnum('appropriation_type'),
  bfars_budget_type: allotmentsBfarsBudgetTypeEnum('bfars_budget_type'),
  allotment_type: allotmentsAllotmentTypeEnum('allotment_type'),
  total_allotment: bigint('total_allotment', { mode: 'number' }),
  workflow_id: uuid('workflow_id'),
  remarks: text('remarks'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AllotmentDraft = InferSelectModel<typeof allotmentDrafts>;
export type NewAllotmentDraft = InferInsertModel<typeof allotmentDrafts>;
