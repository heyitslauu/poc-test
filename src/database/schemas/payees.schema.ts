import { InferSelectModel, InferInsertModel, relations } from 'drizzle-orm';
import { pgTable, uuid, text, pgEnum } from 'drizzle-orm/pg-core';
import { employees } from './employees.schema';

export enum PayeeType {
  CREDITOR = 'CREDITOR',
  EMPLOYEE = 'EMPLOYEE',
  SUPPLIER = 'SUPPLIER',
}

export const payeeTypeEnum = pgEnum('payee_type', [PayeeType.CREDITOR, PayeeType.EMPLOYEE, PayeeType.SUPPLIER]);

export const payees = pgTable('payees', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'),
  employee_id: uuid('employee_id'),
  type: payeeTypeEnum('type').notNull(),
  name: text('name'),
  tin_no: text('tin_no'),
  bank_account_no: text('bank_account_no'),
});

export const payeesRelations = relations(payees, ({ one }) => ({
  employee: one(employees, {
    fields: [payees.employee_id],
    references: [employees.id],
  }),
}));

export type Payee = InferSelectModel<typeof payees>;
export type NewPayee = InferInsertModel<typeof payees>;
