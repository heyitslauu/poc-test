import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { disbursements } from './disbursements.schema';
import { obligationDetails } from './obligation-details.schema';

export const disbursementObligations = pgTable('disbursement_obligations', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  disbursement_id: uuid('disbursement_id')
    .notNull()
    .references(() => disbursements.id),
  obligation_detail_id: uuid('obligation_detail_id')
    .notNull()
    .references(() => obligationDetails.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DisbursementObligation = InferSelectModel<typeof disbursementObligations>;
export type NewDisbursementObligation = InferInsertModel<typeof disbursementObligations>;
