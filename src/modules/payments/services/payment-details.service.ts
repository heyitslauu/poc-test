import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '@/config/database.config';
import { paymentDetails } from '@/database/schemas/payment-details.schema';
import { journalEntries } from '@/database/schemas/journal-entries.schema';
import { CreatePaymentDetailDto } from '../dto/create-payment-detail.dto';
import { UpdatePaymentDetailDto } from '../dto/update-payment-detail.dto';
import { PaymentDetailResponseDto } from '../dto/create-payment-detail.dto';
import { eq, ilike, or, count, and } from 'drizzle-orm';
import * as schema from '@/database/schemas';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PaymentDetailsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>) {}

  async create(createPaymentDetailDto: CreatePaymentDetailDto) {
    return await this.db.transaction(async (tx) => {
      const journalEntriesResult = await tx
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, createPaymentDetailDto.journal_entry_id))
        .limit(1);

      if (journalEntriesResult.length === 0) {
        throw new BadRequestException('Journal entry not found');
      }

      const journalEntry = journalEntriesResult[0];

      if (journalEntry.payee_id !== createPaymentDetailDto.payee_id) {
        throw new BadRequestException('Payee ID must match the journal entry payee');
      }

      const [result] = await tx.insert(paymentDetails).values(createPaymentDetailDto).returning();
      return result;
    });
  }

  async findAll(
    paymentId: string,
    page = 1,
    limit = 10,
    search?: string,
    journal_entry_id?: string,
    payee_id?: string,
    user_id?: string,
  ): Promise<{ data: PaymentDetailResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const searchConditions = search
      ? or(
          ilike(paymentDetails.payment_id, `%${search}%`),
          ilike(paymentDetails.journal_entry_id, `%${search}%`),
          ilike(paymentDetails.payee_id, `%${search}%`),
          ilike(paymentDetails.user_id, `%${search}%`),
        )
      : undefined;

    const filterConditions = and(
      eq(paymentDetails.payment_id, paymentId),
      journal_entry_id ? eq(paymentDetails.journal_entry_id, journal_entry_id) : undefined,
      payee_id ? eq(paymentDetails.payee_id, payee_id) : undefined,
      user_id ? eq(paymentDetails.user_id, user_id) : undefined,
    );

    const whereConditions = and(searchConditions, filterConditions);

    const [paymentDetailsList, [{ value: totalItems }]] = await Promise.all([
      this.db.select().from(paymentDetails).where(whereConditions).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(paymentDetails).where(whereConditions),
    ]);

    return {
      data: plainToInstance(PaymentDetailResponseDto, paymentDetailsList),
      totalItems,
    };
  }

  async findOne(id: string): Promise<PaymentDetailResponseDto> {
    const result = await this.db.select().from(paymentDetails).where(eq(paymentDetails.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Payment detail with ID ${id} not found`);
    }

    return plainToInstance(PaymentDetailResponseDto, result[0]);
  }

  async update(id: string, updatePaymentDetailDto: UpdatePaymentDetailDto): Promise<PaymentDetailResponseDto> {
    return await this.db.transaction(async (tx) => {
      const updateData: Partial<typeof paymentDetails.$inferInsert> = {};

      if (updatePaymentDetailDto.user_id !== undefined) {
        updateData.user_id = updatePaymentDetailDto.user_id;
      }
      if (updatePaymentDetailDto.payment_id !== undefined) {
        updateData.payment_id = updatePaymentDetailDto.payment_id;
      }
      if (updatePaymentDetailDto.journal_entry_id !== undefined) {
        if (updatePaymentDetailDto.payee_id !== undefined) {
          const journalEntriesResult = await tx
            .select()
            .from(journalEntries)
            .where(eq(journalEntries.id, updatePaymentDetailDto.journal_entry_id))
            .limit(1);

          if (journalEntriesResult.length === 0) {
            throw new BadRequestException('Journal entry not found');
          }

          if (journalEntriesResult[0].payee_id !== updatePaymentDetailDto.payee_id) {
            throw new BadRequestException('Payee ID must match journal entry payee');
          }
        }
        updateData.journal_entry_id = updatePaymentDetailDto.journal_entry_id;
      }
      if (updatePaymentDetailDto.payee_id !== undefined) {
        const existingDetail = await tx.select().from(paymentDetails).where(eq(paymentDetails.id, id)).limit(1);

        if (existingDetail.length === 0) {
          throw new NotFoundException(`Payment detail with ID ${id} not found`);
        }

        const journalEntriesResult = await tx
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.id, existingDetail[0].journal_entry_id))
          .limit(1);

        if (journalEntriesResult.length === 0) {
          throw new BadRequestException('Journal entry not found');
        }

        if (journalEntriesResult[0].payee_id !== updatePaymentDetailDto.payee_id) {
          throw new BadRequestException('Payee ID must match journal entry payee');
        }

        updateData.payee_id = updatePaymentDetailDto.payee_id;
      }
      if (updatePaymentDetailDto.amount !== undefined) {
        updateData.amount = updatePaymentDetailDto.amount;
      }

      const [updatedPaymentDetail] = await tx
        .update(paymentDetails)
        .set(updateData)
        .where(eq(paymentDetails.id, id))
        .returning();

      return plainToInstance(PaymentDetailResponseDto, updatedPaymentDetail);
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const existingDetail = await tx.select().from(paymentDetails).where(eq(paymentDetails.id, id)).limit(1);

      if (existingDetail.length === 0) {
        throw new NotFoundException(`Payment detail with ID ${id} not found`);
      }

      await tx.delete(paymentDetails).where(eq(paymentDetails.id, id));
    });
  }
}
