import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, bigint } from 'drizzle-orm/pg-core';
import { allotments } from './allotments.schema';
import { fieldOffices } from './offices.schema';
import { paps } from './pap.schema';
import { revisedChartOfAccounts, rcaSubObjects } from './rca.schema';

export const allotmentDetails = pgTable('allotment_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  allotment_id: uuid('allotment_id')
    .notNull()
    .references(() => allotments.id),
  office_id: uuid('office_id')
    .notNull()
    .references(() => fieldOffices.id),
  pap_id: uuid('pap_id')
    .notNull()
    .references(() => paps.id),
  rca_id: uuid('rca_id')
    .notNull()
    .references(() => revisedChartOfAccounts.id),
  rca_sub_object_id: uuid('rca_sub_object_id').references(() => rcaSubObjects.id),
  amount: bigint('amount', { mode: 'number' }).notNull().default(0),
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
});

export type AllotmentDetail = InferSelectModel<typeof allotmentDetails>;
export type NewAllotmentDetail = InferInsertModel<typeof allotmentDetails>;
