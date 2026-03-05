import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateEarmarkDetailDto } from '../dto/create-earmark-detail.dto';
import { UpdateEarmarkDetailDto } from '../dto/update-earmark-detail.dto';
import { EarmarkDetailResponseDto } from '../dto/earmark-detail-response.dto';
import { EarmarkDetailsPaginationQueryDto } from '../dto/earmark-details-pagination-query.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import * as schema from '../../../database/schemas';
import { AllotmentStatus } from '../../../database/schemas/allotments.schema';
import { earmarkDetails, NewEarmarkDetail } from '../../../database/schemas/earmark-details.schema';

interface RawEarmarkDetail {
  id: string;
  user_id: string;
  earmark_id: string;
  allotment_details_id: string | null;
  allotment_code: string | null;
  amount: number;
  office_id: string | null;
  pap_id: string | null;
  rca_id: string | null;
  office: {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
  } | null;
  pap: {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
  } | null;
  rca: {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
    allows_sub_object: boolean;
  } | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class EarmarkDetailsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private mapToEarmarkDetailResponseDto(rawDetail: RawEarmarkDetail): EarmarkDetailResponseDto {
    return plainToInstance(EarmarkDetailResponseDto, {
      ...rawDetail,
      amount: rawDetail.amount,
      office: rawDetail.office ? plainToInstance(OfficeResponseDto, rawDetail.office) : undefined,
      pap: rawDetail.pap ? plainToInstance(PapResponseDto, rawDetail.pap) : undefined,
      rca: rawDetail.rca ? plainToInstance(RcaResponseDto, rawDetail.rca) : undefined,
    });
  }

  private async getEarmarkDetailsRaw(
    whereConditions: SQL[],
    limit?: number,
    offset?: number,
  ): Promise<RawEarmarkDetail[]> {
    const query = this.db
      .select({
        id: earmarkDetails.id,
        user_id: earmarkDetails.user_id,
        earmark_id: earmarkDetails.earmark_id,
        allotment_details_id: earmarkDetails.allotment_details_id,
        allotment_code: schema.allotments.allotment_code,
        amount: earmarkDetails.amount,
        office_id: schema.allotmentDetails.office_id,
        pap_id: schema.allotmentDetails.pap_id,
        rca_id: schema.allotmentDetails.rca_id,
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
        created_at: earmarkDetails.created_at,
        updated_at: earmarkDetails.updated_at,
      })
      .from(earmarkDetails)
      .leftJoin(schema.allotmentDetails, eq(earmarkDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(schema.allotments, eq(schema.allotmentDetails.allotment_id, schema.allotments.id))
      .leftJoin(schema.fieldOffices, eq(schema.allotmentDetails.office_id, schema.fieldOffices.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .where(and(...whereConditions));

    if (limit !== undefined) {
      query.orderBy(desc(earmarkDetails.created_at)).limit(limit);
      if (offset !== undefined) {
        query.offset(offset);
      }
    }

    return await query;
  }

  async create(createEarmarkDetailDto: CreateEarmarkDetailDto): Promise<EarmarkDetailResponseDto> {
    const earmarkResult = await this.db
      .select()
      .from(schema.earmarks)
      .where(eq(schema.earmarks.id, createEarmarkDetailDto.earmark_id));

    if (earmarkResult.length === 0) {
      throw new NotFoundException(`Earmark with ID ${createEarmarkDetailDto.earmark_id} not found`);
    }

    const allotmentResult = await this.db
      .select()
      .from(schema.allotmentDetails)
      .leftJoin(schema.allotments, eq(schema.allotmentDetails.allotment_id, schema.allotments.id))
      .where(
        and(
          eq(schema.allotmentDetails.id, createEarmarkDetailDto.allotment_details_id),
          eq(schema.allotments.status, AllotmentStatus.APPROVED),
        ),
      );

    if (allotmentResult.length === 0) {
      throw new NotFoundException(
        `Allotment details with ID ${createEarmarkDetailDto.allotment_details_id} not found or not approved`,
      );
    }

    if ((allotmentResult[0].allotments?.fund_cluster as string) !== (earmarkResult[0].fund_cluster as string)) {
      throw new NotFoundException(
        `Allotment details with ID ${createEarmarkDetailDto.allotment_details_id} fund cluster does not match the earmark`,
      );
    }

    try {
      const [earmarkDetail] = await this.db
        .insert(earmarkDetails)
        .values({
          user_id: createEarmarkDetailDto.user_id,
          earmark_id: createEarmarkDetailDto.earmark_id,
          allotment_details_id: createEarmarkDetailDto.allotment_details_id,
          amount: createEarmarkDetailDto.amount * 100,
        } as NewEarmarkDetail)
        .returning();

      return await this.findOne(earmarkDetail.id);
    } catch (error) {
      throw new Error(`Failed to create earmark detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(
    earmarkId: string,
    paginationQuery: EarmarkDetailsPaginationQueryDto,
  ): Promise<{ data: EarmarkDetailResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, allotment_details_id, user_id } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(earmarkDetails.earmark_id, earmarkId)];

    if (allotment_details_id) {
      conditions.push(eq(earmarkDetails.allotment_details_id, allotment_details_id));
    }
    if (user_id) {
      conditions.push(eq(earmarkDetails.user_id, user_id));
    }

    const whereConditions = and(...conditions);

    const [earmarkDetailsData, [{ value: totalItems }]] = await Promise.all([
      this.getEarmarkDetailsRaw(conditions, limit, offset),
      this.db.select({ value: count() }).from(earmarkDetails).where(whereConditions),
    ]);

    const data = earmarkDetailsData.map((detail) => this.mapToEarmarkDetailResponseDto(detail));

    return { data, totalItems };
  }

  async findOne(id: string): Promise<EarmarkDetailResponseDto> {
    const result = await this.getEarmarkDetailsRaw([eq(earmarkDetails.id, id)], 1);

    if (result.length === 0) {
      throw new NotFoundException(`Earmark detail with ID ${id} not found`);
    }

    return this.mapToEarmarkDetailResponseDto(result[0]);
  }

  async update(id: string, updateEarmarkDetailDto: UpdateEarmarkDetailDto): Promise<EarmarkDetailResponseDto> {
    const existingDetail = await this.db.select().from(earmarkDetails).where(eq(earmarkDetails.id, id));

    if (existingDetail.length === 0) {
      throw new NotFoundException(`Earmark detail with ID ${id} not found`);
    }

    const updateData: Partial<NewEarmarkDetail> = {};

    if (updateEarmarkDetailDto.earmark_id !== undefined) {
      updateData.earmark_id = updateEarmarkDetailDto.earmark_id;
    }
    if (updateEarmarkDetailDto.allotment_details_id !== undefined) {
      updateData.allotment_details_id = updateEarmarkDetailDto.allotment_details_id;
    }
    if (updateEarmarkDetailDto.amount !== undefined) {
      updateData.amount = updateEarmarkDetailDto.amount * 100;
    }
    if (updateEarmarkDetailDto.user_id !== undefined) {
      updateData.user_id = updateEarmarkDetailDto.user_id;
    }

    try {
      const result = await this.db.update(earmarkDetails).set(updateData).where(eq(earmarkDetails.id, id)).returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update earmark detail with ID ${id}`);
      }

      return await this.findOne(id);
    } catch (error) {
      throw new Error(`Failed to update earmark detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: string): Promise<void> {
    const existingDetail = await this.db.select().from(earmarkDetails).where(eq(earmarkDetails.id, id));

    if (existingDetail.length === 0) {
      throw new NotFoundException(`Earmark detail with ID ${id} not found`);
    }

    try {
      await this.db.delete(earmarkDetails).where(eq(earmarkDetails.id, id));
    } catch (error) {
      throw new Error(`Failed to delete earmark detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
