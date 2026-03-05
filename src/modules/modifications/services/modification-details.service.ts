import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { plainToInstance } from 'class-transformer';
import { CreateModificationDetailDto } from '../dto/create-modification-detail.dto';
import { UpdateModificationDetailDto } from '../dto/update-modification-detail.dto';
import { ModificationDetailResponseDto } from '../dto/modification-detail-response.dto';
import { ModificationDetailsPaginationQueryDto } from '../dto/modification-details-pagination.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import {
  modificationDetails,
  ModificationAction,
  NewModificationDetail,
} from '../../../database/schemas/modification-details.schema';

@Injectable()
export class ModificationDetailsService {
  private readonly uacsAllotmentDetails = alias(schema.allotmentDetails, 'uacs_allotment_details');

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private getDetailSelectQuery() {
    return {
      id: modificationDetails.id,
      modification_id: modificationDetails.modification_id,
      allotment_details_id: modificationDetails.allotment_details_id,
      sub_aro_details_id: modificationDetails.sub_aro_details_id,
      office_id:
        sql`CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.office_id} ELSE COALESCE(${schema.allotmentDetails.office_id}, ${this.uacsAllotmentDetails.office_id}) END`.as(
          'office_id',
        ),
      office: {
        id: schema.fieldOffices.id,
        code: schema.fieldOffices.code,
        name: schema.fieldOffices.name,
        is_active: schema.fieldOffices.is_active,
      },
      pap_id:
        sql`CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.pap_id} ELSE COALESCE(${schema.allotmentDetails.pap_id}, ${this.uacsAllotmentDetails.pap_id}) END`.as(
          'pap_id',
        ),
      pap: {
        id: schema.paps.id,
        code: schema.paps.code,
        name: schema.paps.name,
        is_active: schema.paps.is_active,
      },
      rca_id:
        sql`CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.rca_id} ELSE COALESCE(${schema.allotmentDetails.rca_id}, ${this.uacsAllotmentDetails.rca_id}) END`.as(
          'rca_id',
        ),
      rca: {
        id: schema.revisedChartOfAccounts.id,
        code: schema.revisedChartOfAccounts.code,
        name: schema.revisedChartOfAccounts.name,
        is_active: schema.revisedChartOfAccounts.is_active,
        allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
      },
      action: modificationDetails.action,
      amount: modificationDetails.amount,
      created_at: modificationDetails.created_at,
      updated_at: modificationDetails.updated_at,
    };
  }

  private async validateModificationAndGetType(modificationId: string) {
    const result = await this.db
      .select({
        id: schema.modifications.id,
        allotment_id: schema.modifications.allotment_id,
        sub_aro_id: schema.modifications.sub_aro_id,
      })
      .from(schema.modifications)
      .where(eq(schema.modifications.id, modificationId));

    if (result.length === 0) {
      throw new NotFoundException(`Modification with ID ${modificationId} not found`);
    }

    return result[0];
  }

  private async validateDetail(
    allotmentDetailsId: string | null | undefined,
    subAroDetailsId: string | null | undefined,
    modification: { allotment_id: string | null; sub_aro_id: string | null },
  ) {
    if ((allotmentDetailsId && subAroDetailsId) || (!allotmentDetailsId && !subAroDetailsId)) {
      throw new BadRequestException('Exactly one of allotment_details_id or sub_aro_details_id must be provided');
    }

    if (modification.allotment_id && !allotmentDetailsId) {
      throw new BadRequestException('This modification is for an allotment and requires allotment_details_id');
    }

    if (modification.sub_aro_id && !subAroDetailsId) {
      throw new BadRequestException('This modification is for a sub-aro and requires sub_aro_details_id');
    }

    if (allotmentDetailsId) {
      const allotmentDetailResult = await this.db
        .select({
          id: schema.allotmentDetails.id,
          allotment_id: schema.allotmentDetails.allotment_id,
        })
        .from(schema.allotmentDetails)
        .where(eq(schema.allotmentDetails.id, allotmentDetailsId));

      if (allotmentDetailResult.length === 0) {
        throw new NotFoundException(`Allotment detail with ID ${allotmentDetailsId} not found`);
      }

      if (allotmentDetailResult[0].allotment_id !== modification.allotment_id) {
        throw new BadRequestException(
          `Allotment detail with ID ${allotmentDetailsId} does not belong to the modification's allotment`,
        );
      }
    }

    if (subAroDetailsId) {
      const subAroDetailResult = await this.db
        .select({
          id: schema.subAroDetails.id,
          sub_aro_id: schema.subAroDetails.sub_aro_id,
        })
        .from(schema.subAroDetails)
        .where(eq(schema.subAroDetails.id, subAroDetailsId));

      if (subAroDetailResult.length === 0) {
        throw new NotFoundException(`Sub-aro detail with ID ${subAroDetailsId} not found`);
      }

      if (subAroDetailResult[0].sub_aro_id !== modification.sub_aro_id) {
        throw new BadRequestException(
          `Sub-aro detail with ID ${subAroDetailsId} does not belong to the modification's sub-aro`,
        );
      }
    }
  }

  private async validateAddActionFields(officeId: string, papId: string, rcaId: string) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(officeId)) {
      throw new BadRequestException(`Invalid office_id format: ${officeId}. Must be a valid UUID`);
    }
    if (!uuidPattern.test(papId)) {
      throw new BadRequestException(`Invalid pap_id format: ${papId}. Must be a valid UUID`);
    }
    if (!uuidPattern.test(rcaId)) {
      throw new BadRequestException(`Invalid rca_id format: ${rcaId}. Must be a valid UUID`);
    }

    const officeResult = await this.db
      .select({ id: schema.fieldOffices.id })
      .from(schema.fieldOffices)
      .where(eq(schema.fieldOffices.id, officeId));

    if (officeResult.length === 0) {
      throw new NotFoundException(`Office with ID ${officeId} not found`);
    }

    const papResult = await this.db.select({ id: schema.paps.id }).from(schema.paps).where(eq(schema.paps.id, papId));

    if (papResult.length === 0) {
      throw new NotFoundException(`PAP with ID ${papId} not found`);
    }

    const rcaResult = await this.db
      .select({ id: schema.revisedChartOfAccounts.id })
      .from(schema.revisedChartOfAccounts)
      .where(eq(schema.revisedChartOfAccounts.id, rcaId));

    if (rcaResult.length === 0) {
      throw new NotFoundException(`RCA with ID ${rcaId} not found`);
    }
  }

  async create(
    userId: string,
    createModificationDetailDto: CreateModificationDetailDto,
  ): Promise<ModificationDetailResponseDto> {
    const modification = await this.validateModificationAndGetType(createModificationDetailDto.modification_id);

    if (createModificationDetailDto.action === ModificationAction.ADD) {
      if (
        !createModificationDetailDto.office_id ||
        !createModificationDetailDto.pap_id ||
        !createModificationDetailDto.rca_id
      ) {
        throw new BadRequestException('office_id, pap_id, and rca_id are required when action is ADD');
      }
      await this.validateAddActionFields(
        createModificationDetailDto.office_id,
        createModificationDetailDto.pap_id,
        createModificationDetailDto.rca_id,
      );
    } else {
      await this.validateDetail(
        createModificationDetailDto.allotment_details_id,
        createModificationDetailDto.sub_aro_details_id,
        modification,
      );
    }

    const isAdd = createModificationDetailDto.action === ModificationAction.ADD;

    const [modificationDetail] = await this.db
      .insert(modificationDetails)
      .values({
        user_id: userId,
        modification_id: createModificationDetailDto.modification_id,
        allotment_details_id: isAdd ? null : createModificationDetailDto.allotment_details_id,
        sub_aro_details_id: isAdd ? null : createModificationDetailDto.sub_aro_details_id,
        office_id: isAdd ? createModificationDetailDto.office_id : null,
        pap_id: isAdd ? createModificationDetailDto.pap_id : null,
        rca_id: isAdd ? createModificationDetailDto.rca_id : null,
        action: createModificationDetailDto.action,
        amount: createModificationDetailDto.amount * 100,
      } as NewModificationDetail)
      .returning();

    return await this.findOne(modificationDetail.id);
  }

  async findAll(
    modificationId: string,
    paginationQuery: ModificationDetailsPaginationQueryDto,
  ): Promise<{ data: ModificationDetailResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, allotment_details_id, sub_aro_details_id, action } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(modificationDetails.modification_id, modificationId)];

    if (allotment_details_id) {
      conditions.push(eq(modificationDetails.allotment_details_id, allotment_details_id));
    }
    if (sub_aro_details_id) {
      conditions.push(eq(modificationDetails.sub_aro_details_id, sub_aro_details_id));
    }
    if (action) {
      conditions.push(eq(modificationDetails.action, action));
    }

    const whereConditions = and(...conditions);

    const [modificationDetailsData, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select(this.getDetailSelectQuery())
        .from(modificationDetails)
        .leftJoin(schema.allotmentDetails, eq(modificationDetails.allotment_details_id, schema.allotmentDetails.id))
        .leftJoin(schema.subAroDetails, eq(modificationDetails.sub_aro_details_id, schema.subAroDetails.id))
        .leftJoin(this.uacsAllotmentDetails, eq(schema.subAroDetails.uacs_id, this.uacsAllotmentDetails.id))
        .leftJoin(schema.modifications, eq(modificationDetails.modification_id, schema.modifications.id))
        .leftJoin(
          schema.fieldOffices,
          sql`${schema.fieldOffices.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.office_id} ELSE COALESCE(${schema.allotmentDetails.office_id}, ${this.uacsAllotmentDetails.office_id}) END`,
        )
        .leftJoin(
          schema.paps,
          sql`${schema.paps.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.pap_id} ELSE COALESCE(${schema.allotmentDetails.pap_id}, ${this.uacsAllotmentDetails.pap_id}) END`,
        )
        .leftJoin(
          schema.revisedChartOfAccounts,
          sql`${schema.revisedChartOfAccounts.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.rca_id} ELSE COALESCE(${schema.allotmentDetails.rca_id}, ${this.uacsAllotmentDetails.rca_id}) END`,
        )
        .where(whereConditions)
        .orderBy(desc(modificationDetails.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(modificationDetails).where(whereConditions),
    ]);

    const data = modificationDetailsData.map((detail) =>
      plainToInstance(ModificationDetailResponseDto, {
        ...detail,
        amount: detail.action === ModificationAction.SUBTRACT ? -detail.amount : detail.amount,
      }),
    );

    return { data, totalItems };
  }

  async findOne(id: string): Promise<ModificationDetailResponseDto> {
    const result = await this.db
      .select(this.getDetailSelectQuery())
      .from(modificationDetails)
      .leftJoin(schema.allotmentDetails, eq(modificationDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(schema.subAroDetails, eq(modificationDetails.sub_aro_details_id, schema.subAroDetails.id))
      .leftJoin(this.uacsAllotmentDetails, eq(schema.subAroDetails.uacs_id, this.uacsAllotmentDetails.id))
      .leftJoin(schema.modifications, eq(modificationDetails.modification_id, schema.modifications.id))
      .leftJoin(
        schema.fieldOffices,
        sql`${schema.fieldOffices.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.office_id} ELSE COALESCE(${schema.allotmentDetails.office_id}, ${this.uacsAllotmentDetails.office_id}) END`,
      )
      .leftJoin(
        schema.paps,
        sql`${schema.paps.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.pap_id} ELSE COALESCE(${schema.allotmentDetails.pap_id}, ${this.uacsAllotmentDetails.pap_id}) END`,
      )
      .leftJoin(
        schema.revisedChartOfAccounts,
        sql`${schema.revisedChartOfAccounts.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${schema.modifications.status} != 'APPROVED' THEN ${modificationDetails.rca_id} ELSE COALESCE(${schema.allotmentDetails.rca_id}, ${this.uacsAllotmentDetails.rca_id}) END`,
      )
      .where(eq(modificationDetails.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Modification detail with ID ${id} not found`);
    }

    const row = result[0];
    return plainToInstance(ModificationDetailResponseDto, {
      ...row,
      amount: row.action === ModificationAction.SUBTRACT ? -row.amount : row.amount,
    });
  }

  async update(
    userId: string,
    id: string,
    updateModificationDetailDto: UpdateModificationDetailDto,
  ): Promise<ModificationDetailResponseDto> {
    const existingDetailResult = await this.db.select().from(modificationDetails).where(eq(modificationDetails.id, id));

    if (existingDetailResult.length === 0) {
      throw new NotFoundException(`Modification detail with ID ${id} not found`);
    }

    const existingDetail = existingDetailResult[0];

    const modificationId = updateModificationDetailDto.modification_id ?? existingDetail.modification_id;
    const allotmentDetailsId =
      updateModificationDetailDto.allotment_details_id !== undefined
        ? updateModificationDetailDto.allotment_details_id
        : existingDetail.allotment_details_id;
    const subAroDetailsId =
      updateModificationDetailDto.sub_aro_details_id !== undefined
        ? updateModificationDetailDto.sub_aro_details_id
        : existingDetail.sub_aro_details_id;

    if (
      updateModificationDetailDto.modification_id !== undefined ||
      updateModificationDetailDto.allotment_details_id !== undefined ||
      updateModificationDetailDto.sub_aro_details_id !== undefined
    ) {
      const modification = await this.validateModificationAndGetType(modificationId);
      await this.validateDetail(allotmentDetailsId, subAroDetailsId, modification);
    }

    const updateData: Partial<NewModificationDetail> = {};
    if (updateModificationDetailDto.modification_id !== undefined) {
      updateData.modification_id = updateModificationDetailDto.modification_id;
    }
    if (updateModificationDetailDto.allotment_details_id !== undefined) {
      updateData.allotment_details_id = updateModificationDetailDto.allotment_details_id;
    }
    if (updateModificationDetailDto.sub_aro_details_id !== undefined) {
      updateData.sub_aro_details_id = updateModificationDetailDto.sub_aro_details_id;
    }
    if (updateModificationDetailDto.action !== undefined) {
      updateData.action = updateModificationDetailDto.action;
    }
    if (updateModificationDetailDto.amount !== undefined) {
      updateData.amount = updateModificationDetailDto.amount * 100;
    }
    updateData.user_id = userId;

    await this.db.update(modificationDetails).set(updateData).where(eq(modificationDetails.id, id));

    return await this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.delete(modificationDetails).where(eq(modificationDetails.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Modification detail with ID ${id} not found`);
    }
  }
}
