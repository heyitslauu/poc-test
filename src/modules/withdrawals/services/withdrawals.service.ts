import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, count, desc, asc, ilike, between, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from '../dto/update-withdrawal.dto';
import { WithdrawalResponseDto } from '../dto/withdrawal-response.dto';
import { WithdrawalDetailResponseDto } from '../dto/withdrawal-detail-response.dto';
import { WithdrawalsPaginationQueryDto } from '../dto/withdrawals-pagination.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { withdrawals, NewWithdrawal, WithdrawalStatus } from '../../../database/schemas/withdrawals.schema';
import { SubAroStatus } from '../../../database/schemas/sub-aro.schema';

@Injectable()
export class WithdrawalsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: string, createWithdrawalDto: CreateWithdrawalDto): Promise<WithdrawalResponseDto> {
    return await this.db.transaction(async (tx) => {
      const result = await tx
        .select()
        .from(schema.subAros)
        .where(
          and(eq(schema.subAros.id, createWithdrawalDto.sub_aro_id), eq(schema.subAros.status, SubAroStatus.APPROVED)),
        );

      if (result.length === 0) {
        throw new NotFoundException(`Approved sub ARO with ID ${createWithdrawalDto.sub_aro_id} not found`);
      }

      const existingWithdrawal = await tx
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.withdrawal_code, createWithdrawalDto.withdrawal_code));

      if (existingWithdrawal.length > 0) {
        throw new ConflictException(`Withdrawal code ${createWithdrawalDto.withdrawal_code} already exists`);
      }

      const [withdrawal] = await tx
        .insert(withdrawals)
        .values({
          withdrawal_code: createWithdrawalDto.withdrawal_code,
          user_id: userId,
          sub_aro_id: createWithdrawalDto.sub_aro_id,
          date: new Date(createWithdrawalDto.date),
          particulars: createWithdrawalDto.particulars,
          status: WithdrawalStatus.FOR_TRIAGE,
        } as NewWithdrawal)
        .returning();

      if (createWithdrawalDto.details && createWithdrawalDto.details.length > 0) {
        for (const detail of createWithdrawalDto.details) {
          const allotmentDetailResult = await tx
            .select()
            .from(schema.subAroDetails)
            .where(eq(schema.subAroDetails.id, detail.sub_aro_details_id));

          if (allotmentDetailResult.length === 0) {
            throw new NotFoundException(`Sub-aro detail with ID ${detail.sub_aro_details_id} not found`);
          }

          await tx.insert(schema.withdrawalDetails).values({
            withdrawal_id: withdrawal.id,
            sub_aro_details_id: detail.sub_aro_details_id,
            amount: detail.amount * 100,
            user_id: userId,
          });
        }
      }

      const withdrawalResponse = plainToInstance(WithdrawalResponseDto, withdrawal);
      if (createWithdrawalDto.details && createWithdrawalDto.details.length > 0) {
        const detailsWithJoins = await tx
          .select({
            detail: schema.withdrawalDetails,
            uacs: schema.allotmentDetails,
            office: {
              id: schema.fieldOffices.id,
              code: schema.fieldOffices.code,
              name: schema.fieldOffices.name,
              is_active: schema.fieldOffices.is_active,
            },
            pap: {
              id: schema.paps.id,
              code: schema.paps.code,
              name: schema.paps.name,
              is_active: schema.paps.is_active,
            },
            rca: {
              id: schema.revisedChartOfAccounts.id,
              code: schema.revisedChartOfAccounts.code,
              name: schema.revisedChartOfAccounts.name,
              is_active: schema.revisedChartOfAccounts.is_active,
              allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
            },
          })
          .from(schema.withdrawalDetails)
          .leftJoin(schema.subAroDetails, eq(schema.withdrawalDetails.sub_aro_details_id, schema.subAroDetails.id))
          .leftJoin(schema.allotmentDetails, eq(schema.subAroDetails.uacs_id, schema.allotmentDetails.id))
          .leftJoin(schema.fieldOffices, eq(schema.allotmentDetails.office_id, schema.fieldOffices.id))
          .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
          .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
          .where(eq(schema.withdrawalDetails.withdrawal_id, withdrawal.id))
          .orderBy(asc(schema.withdrawalDetails.created_at));

        withdrawalResponse.details = detailsWithJoins.map((row) =>
          plainToInstance(WithdrawalDetailResponseDto, {
            ...row.detail,
            sub_aro_details_id: row.detail.sub_aro_details_id,
            office_id: row.uacs?.office_id,
            pap_id: row.uacs?.pap_id,
            rca_id: row.uacs?.rca_id,
            office: row.office,
            pap: row.pap,
            rca: row.rca,
          }),
        );
      }

      return withdrawalResponse;
    });
  }

  async findAll(
    paginationQuery: WithdrawalsPaginationQueryDto,
  ): Promise<{ data: WithdrawalResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, search, date, status, sortByDate, sortByWithdrawalCode } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      const searchCondition = or(
        ilike(withdrawals.withdrawal_code, `%${search}%`),
        ilike(withdrawals.particulars, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status) {
      conditions.push(eq(withdrawals.status, status));
    }

    if (date) {
      const dates = date.split(',').map((d) => d.trim());
      if (dates.length === 1) {
        const startOfDay = new Date(dates[0]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dates[0]);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(between(withdrawals.date, startOfDay, endOfDay));
      } else if (dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(between(withdrawals.date, startDate, endDate));
      }
    }

    const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause: SQL[] = [];

    if (sortByWithdrawalCode) {
      orderByClause.push(
        sortByWithdrawalCode === 'asc' ? asc(withdrawals.withdrawal_code) : desc(withdrawals.withdrawal_code),
      );
    }

    if (sortByDate) {
      orderByClause.push(sortByDate === 'asc' ? asc(withdrawals.date) : desc(withdrawals.date));
    }

    orderByClause.push(asc(withdrawals.created_at));

    const [withdrawalsData, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select()
        .from(withdrawals)
        .where(whereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(withdrawals).where(whereConditions),
    ]);

    const data = withdrawalsData.map((withdrawal) => plainToInstance(WithdrawalResponseDto, withdrawal));

    return { data, totalItems };
  }

  async findOne(id: string): Promise<WithdrawalResponseDto> {
    const withdrawalsWithDetails = await this.db
      .select({
        withdrawal: withdrawals,
        detail: schema.withdrawalDetails,
        uacs: schema.allotmentDetails,
        office: {
          id: schema.fieldOffices.id,
          code: schema.fieldOffices.code,
          name: schema.fieldOffices.name,
          is_active: schema.fieldOffices.is_active,
        },
        pap: {
          id: schema.paps.id,
          code: schema.paps.code,
          name: schema.paps.name,
          is_active: schema.paps.is_active,
        },
        rca: {
          id: schema.revisedChartOfAccounts.id,
          code: schema.revisedChartOfAccounts.code,
          name: schema.revisedChartOfAccounts.name,
          is_active: schema.revisedChartOfAccounts.is_active,
          allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
        },
      })
      .from(withdrawals)
      .leftJoin(schema.withdrawalDetails, eq(withdrawals.id, schema.withdrawalDetails.withdrawal_id))
      .leftJoin(schema.subAroDetails, eq(schema.withdrawalDetails.sub_aro_details_id, schema.subAroDetails.id))
      .leftJoin(schema.allotmentDetails, eq(schema.subAroDetails.uacs_id, schema.allotmentDetails.id))
      .leftJoin(schema.fieldOffices, eq(schema.allotmentDetails.office_id, schema.fieldOffices.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .where(eq(withdrawals.id, id))
      .orderBy(asc(schema.withdrawalDetails.created_at));

    if (withdrawalsWithDetails.length === 0) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    const withdrawal = withdrawalsWithDetails[0].withdrawal;
    const details = withdrawalsWithDetails
      .filter((row) => row.detail)
      .map((row) =>
        plainToInstance(WithdrawalDetailResponseDto, {
          ...row.detail,
          sub_aro_details_id: row.detail?.sub_aro_details_id,
          office_id: row.uacs?.office_id,
          pap_id: row.uacs?.pap_id,
          rca_id: row.uacs?.rca_id,
          office: row.office,
          pap: row.pap,
          rca: row.rca,
        }),
      );

    const response = plainToInstance(WithdrawalResponseDto, withdrawal);
    if (details.length > 0) {
      response.details = details;
    }

    return response;
  }

  async update(id: string, updateWithdrawalDto: UpdateWithdrawalDto): Promise<WithdrawalResponseDto> {
    const existingWithdrawal = await this.db.select().from(withdrawals).where(eq(withdrawals.id, id));

    if (existingWithdrawal.length === 0) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    if (
      existingWithdrawal[0].status !== WithdrawalStatus.DRAFT &&
      existingWithdrawal[0].status !== WithdrawalStatus.FOR_PROCESSING
    ) {
      throw new UnprocessableEntityException(
        `Withdrawal can only be updated when status is DRAFT or FOR_PROCESSING. Current status: ${existingWithdrawal[0].status}`,
      );
    }

    if (
      updateWithdrawalDto.withdrawal_code !== undefined &&
      updateWithdrawalDto.withdrawal_code !== existingWithdrawal[0].withdrawal_code
    ) {
      const existingCode = await this.db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.withdrawal_code, updateWithdrawalDto.withdrawal_code));

      if (existingCode.length > 0) {
        throw new ConflictException(`Withdrawal code ${updateWithdrawalDto.withdrawal_code} already exists`);
      }
    }

    if (updateWithdrawalDto.sub_aro_id) {
      const subAroResult = await this.db
        .select()
        .from(schema.subAros)
        .where(
          and(eq(schema.subAros.id, updateWithdrawalDto.sub_aro_id), eq(schema.subAros.status, SubAroStatus.APPROVED)),
        );

      if (subAroResult.length === 0) {
        throw new NotFoundException(`Approved sub ARO with ID ${updateWithdrawalDto.sub_aro_id} not found`);
      }
    }

    const updateData: Partial<NewWithdrawal> = {};

    if (updateWithdrawalDto.withdrawal_code !== undefined) {
      updateData.withdrawal_code = updateWithdrawalDto.withdrawal_code;
    }
    if (updateWithdrawalDto.sub_aro_id !== undefined) {
      updateData.sub_aro_id = updateWithdrawalDto.sub_aro_id;
    }
    if (updateWithdrawalDto.date !== undefined) {
      updateData.date = new Date(updateWithdrawalDto.date);
    }
    if (updateWithdrawalDto.particulars !== undefined) {
      updateData.particulars = updateWithdrawalDto.particulars;
    }

    try {
      const result = await this.db
        .update(withdrawals)
        .set(updateData)
        .where(
          and(
            eq(withdrawals.id, id),
            or(eq(withdrawals.status, WithdrawalStatus.DRAFT), eq(withdrawals.status, WithdrawalStatus.FOR_PROCESSING)),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update withdrawal with ID ${id}`);
      }

      const updatedWithdrawal = result[0];
      return plainToInstance(WithdrawalResponseDto, updatedWithdrawal);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update withdrawal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async updateStatus(id: string, status: WithdrawalStatus): Promise<WithdrawalResponseDto> {
    const existingWithdrawal = await this.db.select().from(withdrawals).where(eq(withdrawals.id, id));

    if (existingWithdrawal.length === 0) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    const result = await this.db.update(withdrawals).set({ status }).where(eq(withdrawals.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update withdrawal status with ID ${id}`);
    }

    const updatedWithdrawal = result[0];
    return plainToInstance(WithdrawalResponseDto, updatedWithdrawal);
  }
}
