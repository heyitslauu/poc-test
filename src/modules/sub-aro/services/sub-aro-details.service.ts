import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateSubAroDetailsDto } from '../dto/create-sub-aro-details.dto';
import { UpdateSubAroDetailsDto } from '../dto/update-sub-aro-details.dto';
import { SubAroDetailsResponseDto } from '../dto/sub-aro-details-response.dto';
import { SubAroDetailsPaginationQueryDto } from '../dto/sub-aro-details-pagination.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { subAroDetails, NewSubAroDetail } from '../../../database/schemas/sub-aro-details.schema';

@Injectable()
export class SubAroDetailsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createSubAroDetailsDto: CreateSubAroDetailsDto): Promise<SubAroDetailsResponseDto> {
    const subAroResult = await this.db
      .select()
      .from(schema.subAros)
      .where(eq(schema.subAros.id, createSubAroDetailsDto.sub_aro_id));

    if (subAroResult.length === 0) {
      throw new NotFoundException(`Sub-aro with ID ${createSubAroDetailsDto.sub_aro_id} not found`);
    }

    const allotmentDetailsResult = await this.db
      .select()
      .from(schema.allotmentDetails)
      .where(eq(schema.allotmentDetails.id, createSubAroDetailsDto.uacs_id));

    if (allotmentDetailsResult.length === 0) {
      throw new NotFoundException(`Allotment details with ID ${createSubAroDetailsDto.uacs_id} not found`);
    }

    try {
      const [subAroDetail] = await this.db
        .insert(subAroDetails)
        .values({
          sub_aro_id: createSubAroDetailsDto.sub_aro_id,
          uacs_id: createSubAroDetailsDto.uacs_id,
          amount: createSubAroDetailsDto.amount * 100,
        } as NewSubAroDetail)
        .returning();

      return await this.findOne(subAroDetail.id);
    } catch (error) {
      throw new Error(`Failed to create sub-aro detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(
    subAroId: string,
    paginationQuery: SubAroDetailsPaginationQueryDto,
  ): Promise<{ data: SubAroDetailsResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, uacs_id } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(subAroDetails.sub_aro_id, subAroId)];

    if (uacs_id) {
      conditions.push(eq(subAroDetails.uacs_id, uacs_id));
    }

    const whereConditions = and(...conditions);

    const [subAroDetailsData, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select({
          id: subAroDetails.id,
          sub_aro_id: subAroDetails.sub_aro_id,
          uacs_id: subAroDetails.uacs_id,
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
          amount: subAroDetails.amount,
          created_at: subAroDetails.created_at,
          updated_at: subAroDetails.updated_at,
        })
        .from(subAroDetails)
        .leftJoin(schema.allotmentDetails, eq(subAroDetails.uacs_id, schema.allotmentDetails.id))
        .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
        .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
        .leftJoin(schema.rcaSubObjects, eq(schema.allotmentDetails.rca_sub_object_id, schema.rcaSubObjects.id))
        .where(whereConditions)
        .orderBy(desc(subAroDetails.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(subAroDetails).where(whereConditions),
    ]);

    const data = subAroDetailsData.map((detail) => plainToInstance(SubAroDetailsResponseDto, detail));

    return { data, totalItems };
  }

  async findOne(id: string): Promise<SubAroDetailsResponseDto> {
    const result = await this.db
      .select({
        id: subAroDetails.id,
        sub_aro_id: subAroDetails.sub_aro_id,
        uacs_id: subAroDetails.uacs_id,
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
        amount: subAroDetails.amount,
        created_at: subAroDetails.created_at,
        updated_at: subAroDetails.updated_at,
      })
      .from(subAroDetails)
      .leftJoin(schema.allotmentDetails, eq(subAroDetails.uacs_id, schema.allotmentDetails.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .leftJoin(schema.rcaSubObjects, eq(schema.allotmentDetails.rca_sub_object_id, schema.rcaSubObjects.id))
      .where(eq(subAroDetails.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Sub-aro detail with ID ${id} not found`);
    }

    return plainToInstance(SubAroDetailsResponseDto, result[0]);
  }

  async update(id: string, updateSubAroDetailsDto: UpdateSubAroDetailsDto): Promise<SubAroDetailsResponseDto> {
    const existingDetail = await this.db.select().from(subAroDetails).where(eq(subAroDetails.id, id));

    if (existingDetail.length === 0) {
      throw new NotFoundException(`Sub-aro detail with ID ${id} not found`);
    }

    const updateData: Partial<NewSubAroDetail> = {};

    if (updateSubAroDetailsDto.sub_aro_id !== undefined) {
      updateData.sub_aro_id = updateSubAroDetailsDto.sub_aro_id;
    }
    if (updateSubAroDetailsDto.uacs_id !== undefined) {
      updateData.uacs_id = updateSubAroDetailsDto.uacs_id;
    }
    if (updateSubAroDetailsDto.amount !== undefined) {
      updateData.amount = updateSubAroDetailsDto.amount * 100;
    }

    try {
      const result = await this.db.update(subAroDetails).set(updateData).where(eq(subAroDetails.id, id)).returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update sub-aro detail with ID ${id}`);
      }

      return await this.findOne(id);
    } catch (error) {
      throw new Error(`Failed to update sub-aro detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: string): Promise<void> {
    const existingDetail = await this.db.select().from(subAroDetails).where(eq(subAroDetails.id, id));

    if (existingDetail.length === 0) {
      throw new NotFoundException(`Sub-aro detail with ID ${id} not found`);
    }

    try {
      await this.db.delete(subAroDetails).where(eq(subAroDetails.id, id));
    } catch (error) {
      throw new Error(`Failed to delete sub-aro detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
