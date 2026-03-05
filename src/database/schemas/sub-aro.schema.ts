import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { allotments } from './allotments.schema';
import { fieldOffices } from './offices.schema';
import { pgTable, uuid, timestamp, text, pgEnum, varchar } from 'drizzle-orm/pg-core';

export enum SubAroStatus {
  DRAFT = 'DRAFT',
  FOR_TRIAGE = 'FOR_TRIAGE',
  FOR_PROCESSING = 'FOR_PROCESSING',
  FOR_PEER_REVIEW = 'FOR_PEER_REVIEW',
  FOR_APPROVAL = 'FOR_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const subAroStatusEnum = pgEnum('status', [
  SubAroStatus.DRAFT,
  SubAroStatus.FOR_TRIAGE,
  SubAroStatus.FOR_PROCESSING,
  SubAroStatus.FOR_PEER_REVIEW,
  SubAroStatus.FOR_APPROVAL,
  SubAroStatus.APPROVED,
  SubAroStatus.REJECTED,
]);

export const subAros = pgTable('sub_aros', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  office_id: uuid('office_id').references(() => fieldOffices.id),
  allotment_id: uuid('allotment_id')
    .notNull()
    .references(() => allotments.id),
  sub_aro_code: varchar('sub_aro_code', { length: 150 }).unique(),
  date: timestamp('date').notNull(),
  particulars: text('particulars').notNull(),
  status: subAroStatusEnum('status').notNull(),
  workflow_id: uuid('workflow_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SubAro = InferSelectModel<typeof subAros>;
export type NewSubAro = InferInsertModel<typeof subAros>;
