import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateWithdrawalDetailDto } from '../dto/create-withdrawal-detail.dto';
import { UpdateWithdrawalDetailDto } from '../dto/update-withdrawal-detail.dto';
import { WithdrawalDetailResponseDto } from '../dto/withdrawal-detail-response.dto';
import { WithdrawalDetailsPaginationQueryDto } from '../dto/withdrawal-details-pagination.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { withdrawalDetails, NewWithdrawalDetail } from '../../../database/schemas/withdrawal-details.schema';

@Injectable()
export class WithdrawDetailsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: string,
    createWithdrawalDetailDto: CreateWithdrawalDetailDto,
  ): Promise<WithdrawalDetailResponseDto> {
    const withdrawalResult = await this.db
      .select()
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.id, createWithdrawalDetailDto.withdrawal_id));

    if (withdrawalResult.length === 0) {
      throw new NotFoundException(`Withdrawal with ID ${createWithdrawalDetailDto.withdrawal_id} not found`);
    }

    const allotmentDetailResult = await this.db
      .select()
      .from(schema.subAroDetails)
      .where(eq(schema.subAroDetails.id, createWithdrawalDetailDto.sub_aro_details_id));

    if (allotmentDetailResult.length === 0) {
      throw new NotFoundException(`Sub-aro detail with ID ${createWithdrawalDetailDto.sub_aro_details_id} not found`);
    }

    try {
      const [withdrawalDetail] = await this.db
        .insert(withdrawalDetails)
        .values({
          withdrawal_id: createWithdrawalDetailDto.withdrawal_id,
          sub_aro_details_id: createWithdrawalDetailDto.sub_aro_details_id,
          amount: createWithdrawalDetailDto.amount * 100,
          user_id: userId,
        } as NewWithdrawalDetail)
        .returning();

      return await this.findOne(withdrawalDetail.id);
    } catch (error) {
      throw new Error(`Failed to create withdrawal detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(
    withdrawalId: string,
    paginationQuery: WithdrawalDetailsPaginationQueryDto,
  ): Promise<{ data: WithdrawalDetailResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, sub_aro_details_id } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(withdrawalDetails.withdrawal_id, withdrawalId)];

    if (sub_aro_details_id) {
      conditions.push(eq(withdrawalDetails.sub_aro_details_id, sub_aro_details_id));
    }

    const whereConditions = and(...conditions);

    const [withdrawalDetailsData, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select({
          id: withdrawalDetails.id,
          withdrawal_id: withdrawalDetails.withdrawal_id,
          sub_aro_details_id: withdrawalDetails.sub_aro_details_id,
          office_id: schema.allotmentDetails.office_id,
          office: {
            id: schema.fieldOffices.id,
            code: schema.fieldOffices.code,
            name: schema.fieldOffices.name,
            is_active: schema.fieldOffices.is_active,
          },
          pap_id: schema.allotmentDetails.pap_id,
          pap: {
            id: schema.paps.id,
            code: schema.paps.code,
            name: schema.paps.name,
            is_active: schema.paps.is_active,
          },
          rca_id: schema.allotmentDetails.rca_id,
          rca: {
            id: schema.revisedChartOfAccounts.id,
            code: schema.revisedChartOfAccounts.code,
            name: schema.revisedChartOfAccounts.name,
            is_active: schema.revisedChartOfAccounts.is_active,
            allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
          },
          amount: withdrawalDetails.amount,
          created_at: withdrawalDetails.created_at,
          updated_at: withdrawalDetails.updated_at,
        })
        .from(withdrawalDetails)
        .leftJoin(schema.subAroDetails, eq(withdrawalDetails.sub_aro_details_id, schema.subAroDetails.id))
        .leftJoin(schema.allotmentDetails, eq(schema.subAroDetails.uacs_id, schema.allotmentDetails.id))
        .leftJoin(schema.fieldOffices, eq(schema.allotmentDetails.office_id, schema.fieldOffices.id))
        .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
        .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
        .where(whereConditions)
        .orderBy(desc(withdrawalDetails.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(withdrawalDetails).where(whereConditions),
    ]);

    const data = withdrawalDetailsData.map((detail) => plainToInstance(WithdrawalDetailResponseDto, detail));

    return { data, totalItems };
  }

  async findOne(id: string): Promise<WithdrawalDetailResponseDto> {
    const result = await this.db
      .select({
        id: withdrawalDetails.id,
        withdrawal_id: withdrawalDetails.withdrawal_id,
        sub_aro_details_id: withdrawalDetails.sub_aro_details_id,
        office_id: schema.allotmentDetails.office_id,
        office: {
          id: schema.fieldOffices.id,
          code: schema.fieldOffices.code,
          name: schema.fieldOffices.name,
          is_active: schema.fieldOffices.is_active,
        },
        pap_id: schema.allotmentDetails.pap_id,
        pap: {
          id: schema.paps.id,
          code: schema.paps.code,
          name: schema.paps.name,
          is_active: schema.paps.is_active,
        },
        rca_id: schema.allotmentDetails.rca_id,
        rca: {
          id: schema.revisedChartOfAccounts.id,
          code: schema.revisedChartOfAccounts.code,
          name: schema.revisedChartOfAccounts.name,
          is_active: schema.revisedChartOfAccounts.is_active,
          allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
        },
        amount: withdrawalDetails.amount,
        created_at: withdrawalDetails.created_at,
        updated_at: withdrawalDetails.updated_at,
      })
      .from(withdrawalDetails)
      .leftJoin(schema.subAroDetails, eq(withdrawalDetails.sub_aro_details_id, schema.subAroDetails.id))
      .leftJoin(schema.allotmentDetails, eq(schema.subAroDetails.uacs_id, schema.allotmentDetails.id))
      .leftJoin(schema.fieldOffices, eq(schema.allotmentDetails.office_id, schema.fieldOffices.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .where(eq(withdrawalDetails.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Withdrawal detail with ID ${id} not found`);
    }

    return plainToInstance(WithdrawalDetailResponseDto, result[0]);
  }

  async update(id: string, updateWithdrawalDetailDto: UpdateWithdrawalDetailDto): Promise<WithdrawalDetailResponseDto> {
    const updateData: Partial<NewWithdrawalDetail> = {};

    if (updateWithdrawalDetailDto.withdrawal_id) {
      const withdrawalResult = await this.db
        .select()
        .from(schema.withdrawals)
        .where(eq(schema.withdrawals.id, updateWithdrawalDetailDto.withdrawal_id));

      if (withdrawalResult.length === 0) {
        throw new NotFoundException(`Withdrawal with ID ${updateWithdrawalDetailDto.withdrawal_id} not found`);
      }
      updateData.withdrawal_id = updateWithdrawalDetailDto.withdrawal_id;
    }

    if (updateWithdrawalDetailDto.sub_aro_details_id) {
      const allotmentDetailResult = await this.db
        .select()
        .from(schema.subAroDetails)
        .where(eq(schema.subAroDetails.id, updateWithdrawalDetailDto.sub_aro_details_id));

      if (allotmentDetailResult.length === 0) {
        throw new NotFoundException(`Sub-aro detail with ID ${updateWithdrawalDetailDto.sub_aro_details_id} not found`);
      }
      updateData.sub_aro_details_id = updateWithdrawalDetailDto.sub_aro_details_id;
    }
    if (updateWithdrawalDetailDto.amount !== undefined) {
      updateData.amount = updateWithdrawalDetailDto.amount * 100;
    }

    try {
      await this.db.update(withdrawalDetails).set(updateData).where(eq(withdrawalDetails.id, id));

      return await this.findOne(id);
    } catch (error) {
      throw new Error(`Failed to update withdrawal detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(withdrawalDetails).where(eq(withdrawalDetails.id, id));
    } catch (error) {
      throw new Error(`Failed to delete withdrawal detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
