import { InferSelectModel, InferInsertModel, sql } from 'drizzle-orm';
import { modifications } from './modification.schema';
import { allotmentDetails } from './allotment-details.schema';
import { subAroDetails } from './sub-aro-details.schema';
import { pgTable, uuid, timestamp, bigint, pgEnum, check } from 'drizzle-orm/pg-core';
import { fieldOffices } from './offices.schema';
import { paps } from './pap.schema';
import { rcaSubObjects, revisedChartOfAccounts } from './rca.schema';

export enum ModificationAction {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
}

export const modificationsActionEnum = pgEnum('action', [ModificationAction.ADD, ModificationAction.SUBTRACT]);

export const modificationDetails = pgTable(
  'modification_details',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id'),
    modification_id: uuid('modification_id')
      .notNull()
      .references(() => modifications.id),
    allotment_details_id: uuid('allotment_details_id').references(() => allotmentDetails.id),
    sub_aro_details_id: uuid('sub_aro_details_id').references(() => subAroDetails.id),

    office_id: uuid('office_id').references(() => fieldOffices.id),
    pap_id: uuid('pap_id').references(() => paps.id),
    rca_id: uuid('rca_id').references(() => revisedChartOfAccounts.id),
    rca_sub_object_id: uuid('rca_sub_object_id').references(() => rcaSubObjects.id),

    action: modificationsActionEnum('action').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'only_one_detail_reference',
      sql`(${table.action} = 'ADD') OR (${table.action} = 'SUBTRACT' AND ((${table.allotment_details_id} IS NOT NULL AND ${table.sub_aro_details_id} IS NULL) OR (${table.allotment_details_id} IS NULL AND ${table.sub_aro_details_id} IS NOT NULL)))`,
    ),
  ],
);

export type ModificationDetail = InferSelectModel<typeof modificationDetails>;
export type NewModificationDetail = InferInsertModel<typeof modificationDetails>;
