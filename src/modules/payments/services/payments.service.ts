import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, ilike, or, count, and } from 'drizzle-orm';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { DATABASE_CONNECTION } from '@/config/database.config';
import * as schema from '@/database/schemas';
import {
  payments,
  PaymentType,
  PaymentStatus,
  SpoilCheckStatus,
  BankAccountType,
} from '@/database/schemas/payments.schema';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: string, createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return await this.db.transaction(async (tx) => {
      const [payment] = await tx
        .insert(payments)
        .values({
          user_id: userId,
          fund_cluster: createPaymentDto.fund_cluster,
          bank_account_no: createPaymentDto.bank_account_no,
          status: createPaymentDto.status,
          type: createPaymentDto.type,
          payment_reference_no: createPaymentDto.payment_reference_no || null,
          spoil_check_status: createPaymentDto.spoil_check_status,
          remarks: createPaymentDto.remarks || null,
        })
        .returning();

      return plainToInstance(PaymentResponseDto, payment);
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    type?: PaymentType,
    status?: PaymentStatus,
    spoil_check_status?: SpoilCheckStatus,
    bank_account_no?: BankAccountType,
    user_id?: string,
    fund_cluster?: FundCluster,
  ): Promise<{ data: PaymentResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const fundClusterBankAccountMap: Record<FundCluster, BankAccountType[]> = {
      [FundCluster.REGULAR_AGENCY_FUND]: [
        BankAccountType.REGULAR_AGENCY_LBP_MDS,
        BankAccountType.REGULAR_AGENCY_LBP_DSWD_BIR,
        BankAccountType.REGULAR_AGENCY_BTR,
      ],
      [FundCluster.FOREIGN_ASSISTED_PROJECTS_FUND]: [
        BankAccountType.FOREIGN_ASSISTED_LBP_MDS_KALAHI,
        BankAccountType.FOREIGN_ASSISTED_LBP_DSWD_FOV_KC,
        BankAccountType.FOREIGN_ASSISTED_BTR,
      ],
      [FundCluster.SPECIAL_ACCOUNT_LOCALLY_FUNDED_DOMESTIC_GRANTS_FUND]: [
        BankAccountType.SPECIAL_LOCALLY_FUNDED_DSWD_FO5_BCDA,
        BankAccountType.SPECIAL_LOCALLY_FUNDED_BTR,
      ],
      [FundCluster.SPECIAL_ACCOUNT_FOREIGN_ASSISTED_FOREIGN_GRANTS_FUND]: [
        BankAccountType.SPECIAL_FOREIGN_ASSISTED_LBP_MDS,
        BankAccountType.SPECIAL_FOREIGN_ASSISTED_BTR,
      ],
      [FundCluster.INTERNALLY_GENERATED_FUNDS]: [BankAccountType.INTERNALLY_GENERATED_BTR],
      [FundCluster.BUSINESS_RELATED_FUNDS]: [
        BankAccountType.BUSINESS_RELATED_LBP_SEA_RSF,
        BankAccountType.BUSINESS_RELATED_BTR,
      ],
      [FundCluster.TRUST_RECEIPTS]: [
        BankAccountType.TRUST_RECEIPTS_LBP_MDS,
        BankAccountType.TRUST_RECEIPTS_DBP_MISC,
        BankAccountType.TRUST_RECEIPTS_BTR,
      ],
    };

    const searchConditions = search
      ? or(ilike(payments.payment_reference_no, `%${search}%`), ilike(payments.remarks, `%${search}%`))
      : undefined;

    let bankAccountFilter = bank_account_no ? eq(payments.bank_account_no, bank_account_no) : undefined;

    if (fund_cluster) {
      const allowedBankAccounts = fundClusterBankAccountMap[fund_cluster];

      if (allowedBankAccounts.length === 0) {
        return { data: [], totalItems: 0 };
      }

      if (!bank_account_no) {
        bankAccountFilter = or(...allowedBankAccounts.map((type) => eq(payments.bank_account_no, type)));
      } else {
        if (!allowedBankAccounts.includes(bank_account_no)) {
          return { data: [], totalItems: 0 };
        }
        bankAccountFilter = eq(payments.bank_account_no, bank_account_no);
      }
    }

    const filterConditions = and(
      type ? eq(payments.type, type) : undefined,
      status ? eq(payments.status, status) : undefined,
      spoil_check_status ? eq(payments.spoil_check_status, spoil_check_status) : undefined,
      bankAccountFilter,
      user_id ? eq(payments.user_id, user_id) : undefined,
      fund_cluster ? eq(payments.fund_cluster, fund_cluster) : undefined,
    );

    const whereConditions = and(searchConditions, filterConditions);

    const [paymentsList, [{ value: totalItems }]] = await Promise.all([
      this.db.select().from(payments).where(whereConditions).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(payments).where(whereConditions),
    ]);

    return {
      data: plainToInstance(PaymentResponseDto, paymentsList),
      totalItems,
    };
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    const result = await this.db.select().from(payments).where(eq(payments.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return plainToInstance(PaymentResponseDto, result[0]);
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    const updateData: Partial<typeof payments.$inferInsert> = {};

    if (updatePaymentDto.user_id !== undefined) {
      updateData.user_id = updatePaymentDto.user_id;
    }
    if (updatePaymentDto.fund_cluster !== undefined) {
      updateData.fund_cluster = updatePaymentDto.fund_cluster;
    }
    if (updatePaymentDto.bank_account_no !== undefined) {
      updateData.bank_account_no = updatePaymentDto.bank_account_no;
    }
    if (updatePaymentDto.status !== undefined) {
      updateData.status = updatePaymentDto.status;
    }
    if (updatePaymentDto.type !== undefined) {
      updateData.type = updatePaymentDto.type;
    }
    if (updatePaymentDto.payment_reference_no !== undefined) {
      updateData.payment_reference_no = updatePaymentDto.payment_reference_no;
    }
    if (updatePaymentDto.spoil_check_status !== undefined) {
      updateData.spoil_check_status = updatePaymentDto.spoil_check_status;
    }
    if (updatePaymentDto.remarks !== undefined) {
      updateData.remarks = updatePaymentDto.remarks;
    }

    const [updatedPayment] = await this.db.update(payments).set(updateData).where(eq(payments.id, id)).returning();

    return plainToInstance(PaymentResponseDto, updatedPayment);
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<PaymentResponseDto> {
    const existingPayment = await this.db.select().from(payments).where(eq(payments.id, id));

    if (existingPayment.length === 0) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const [updatedPayment] = await this.db.update(payments).set({ status }).where(eq(payments.id, id)).returning();

    return plainToInstance(PaymentResponseDto, updatedPayment);
  }
}
