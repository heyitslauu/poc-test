import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, count, desc, asc, ilike, between, SQL, InferSelectModel, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { plainToInstance } from 'class-transformer';
import { CreateModificationDto } from '../dto/create-modification.dto';
import { ModificationType } from '../dto/create-modification.dto';
import { UpdateModificationDto } from '../dto/update-modification.dto';
import { ModificationResponseDto } from '../dto/modification-response.dto';
import { ModificationDetailResponseDto } from '../dto/modification-detail-response.dto';
import { ModificationsPaginationQueryDto } from '../dto/modifications-pagination.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { modifications, NewModification, ModificationStatus } from '../../../database/schemas/modification.schema';
import { AllotmentStatus } from '../../../database/schemas/allotments.schema';
import { SubAroStatus } from '../../../database/schemas/sub-aro.schema';
import {
  modificationDetails,
  ModificationAction,
  NewModificationDetail,
} from '../../../database/schemas/modification-details.schema';

type ModificationRow = InferSelectModel<typeof modifications>;

type ModificationWithDetailsRow = {
  modification: ModificationRow;
  detail: InferSelectModel<typeof modificationDetails> | null;
  allotmentDetail: InferSelectModel<typeof schema.allotmentDetails> | null;
  subAroDetail: InferSelectModel<typeof schema.subAroDetails> | null;
  allotmentDetailFromSubAro: InferSelectModel<typeof schema.allotmentDetails> | null;
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
  allotment_code: string | null;
  sub_aro_code: string | null;
};

@Injectable()
export class ModificationsService {
  private readonly allotmentDetailsFromSubAro = alias(schema.allotmentDetails, 'allotment_details_from_sub_aro');

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

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

  private getAllotmentModificationsWithDetailsQuery() {
    return this.db
      .select({
        modification: modifications,
        detail: modificationDetails,
        allotmentDetail: schema.allotmentDetails,
        subAroDetail: sql<InferSelectModel<typeof schema.subAroDetails> | null>`NULL`,
        allotmentDetailFromSubAro: sql<InferSelectModel<typeof schema.allotmentDetails> | null>`NULL`,
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
        allotment_code: schema.allotments.allotment_code,
        sub_aro_code: sql<string | null>`NULL`,
      })
      .from(modifications)
      .innerJoin(schema.allotments, eq(modifications.allotment_id, schema.allotments.id))
      .leftJoin(modificationDetails, eq(modifications.id, modificationDetails.modification_id))
      .leftJoin(schema.allotmentDetails, eq(modificationDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(
        schema.fieldOffices,
        sql`${schema.fieldOffices.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${modifications.status} != 'APPROVED' THEN ${modificationDetails.office_id} ELSE ${schema.allotmentDetails.office_id} END`,
      )
      .leftJoin(
        schema.paps,
        sql`${schema.paps.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${modifications.status} != 'APPROVED' THEN ${modificationDetails.pap_id} ELSE ${schema.allotmentDetails.pap_id} END`,
      )
      .leftJoin(
        schema.revisedChartOfAccounts,
        sql`${schema.revisedChartOfAccounts.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${modifications.status} != 'APPROVED' THEN ${modificationDetails.rca_id} ELSE ${schema.allotmentDetails.rca_id} END`,
      );
  }

  private getSubAroModificationsWithDetailsQuery() {
    return this.db
      .select({
        modification: modifications,
        detail: modificationDetails,
        allotmentDetail: sql<InferSelectModel<typeof schema.allotmentDetails> | null>`NULL`,
        subAroDetail: schema.subAroDetails,
        allotmentDetailFromSubAro: this.allotmentDetailsFromSubAro,
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
        allotment_code: sql<string | null>`NULL`,
        sub_aro_code: schema.subAros.sub_aro_code,
      })
      .from(modifications)
      .innerJoin(schema.subAros, eq(modifications.sub_aro_id, schema.subAros.id))
      .leftJoin(modificationDetails, eq(modifications.id, modificationDetails.modification_id))
      .leftJoin(schema.subAroDetails, eq(modificationDetails.sub_aro_details_id, schema.subAroDetails.id))
      .leftJoin(this.allotmentDetailsFromSubAro, eq(schema.subAroDetails.uacs_id, this.allotmentDetailsFromSubAro.id))
      .leftJoin(
        schema.fieldOffices,
        sql`${schema.fieldOffices.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${modifications.status} != 'APPROVED' THEN ${modificationDetails.office_id} ELSE ${this.allotmentDetailsFromSubAro.office_id} END`,
      )
      .leftJoin(
        schema.paps,
        sql`${schema.paps.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${modifications.status} != 'APPROVED' THEN ${modificationDetails.pap_id} ELSE ${this.allotmentDetailsFromSubAro.pap_id} END`,
      )
      .leftJoin(
        schema.revisedChartOfAccounts,
        sql`${schema.revisedChartOfAccounts.id} = CASE WHEN ${modificationDetails.action} = 'ADD' AND ${modifications.status} != 'APPROVED' THEN ${modificationDetails.rca_id} ELSE ${this.allotmentDetailsFromSubAro.rca_id} END`,
      );
  }

  private processModificationsWithDetails(rows: ModificationWithDetailsRow[]): ModificationResponseDto[] {
    const modificationMap = new Map<
      string,
      {
        modification: ModificationRow & { allotment_code: string | null; sub_aro_code: string | null };
        details: ModificationDetailResponseDto[];
      }
    >();

    for (const row of rows) {
      const modId = row.modification.id;
      if (!modificationMap.has(modId)) {
        modificationMap.set(modId, {
          modification: { ...row.modification, allotment_code: row.allotment_code, sub_aro_code: row.sub_aro_code },
          details: [],
        });
      }
      if (row.detail) {
        const isAdd = row.detail.action === ModificationAction.ADD;
        const isApproved = row.modification.status === ModificationStatus.APPROVED;
        const detailSource = row.allotmentDetail || row.allotmentDetailFromSubAro;

        const detail = plainToInstance(ModificationDetailResponseDto, {
          ...row.detail,
          office_id: isAdd && !isApproved ? row.detail.office_id : detailSource?.office_id,
          pap_id: isAdd && !isApproved ? row.detail.pap_id : detailSource?.pap_id,
          rca_id: isAdd && !isApproved ? row.detail.rca_id : detailSource?.rca_id,
          office: row.office,
          pap: row.pap,
          rca: row.rca,
        });
        const entry = modificationMap.get(modId);
        if (entry) {
          entry.details.push(detail);
        }
      }
    }

    return Array.from(modificationMap.values()).map(({ modification, details }) => {
      const response = plainToInstance(ModificationResponseDto, modification);

      response.type = modification.allotment_id ? ModificationType.ALLOTMENT : ModificationType.SARO;

      if (details.length > 0) {
        details.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        response.details = details;
        const totalAmount = details.reduce((sum, detail) => {
          const multiplier = detail.action === ModificationAction.SUBTRACT ? -1 : 1;
          return sum + multiplier * detail.amount * 100;
        }, 0);
        response.total_amount = totalAmount / 100;
      }
      return response;
    });
  }

  async create(userId: string, createModificationDto: CreateModificationDto): Promise<ModificationResponseDto> {
    if (createModificationDto.type === ModificationType.ALLOTMENT && !createModificationDto.allotment_id) {
      throw new BadRequestException('allotment_id is required when type is ALLOTMENT');
    }

    if (createModificationDto.type === ModificationType.SARO && !createModificationDto.sub_aro_id) {
      throw new BadRequestException('sub_aro_id is required when type is SARO');
    }

    if (createModificationDto.type === ModificationType.ALLOTMENT && createModificationDto.sub_aro_id) {
      throw new BadRequestException('sub_aro_id should not be provided when type is ALLOTMENT');
    }

    if (createModificationDto.type === ModificationType.SARO && createModificationDto.allotment_id) {
      throw new BadRequestException('allotment_id should not be provided when type is SARO');
    }

    if (createModificationDto.allotment_id) {
      const allotmentId = createModificationDto.allotment_id;
      const result = await this.db
        .select()
        .from(schema.allotments)
        .where(and(eq(schema.allotments.id, allotmentId), eq(schema.allotments.status, AllotmentStatus.APPROVED)));

      if (result.length === 0) {
        throw new NotFoundException(`Approved allotment with ID ${allotmentId} not found`);
      }
    }

    if (createModificationDto.sub_aro_id) {
      const subAroId = createModificationDto.sub_aro_id;
      const result = await this.db
        .select()
        .from(schema.subAros)
        .where(and(eq(schema.subAros.id, subAroId), eq(schema.subAros.status, SubAroStatus.APPROVED)));

      if (result.length === 0) {
        throw new NotFoundException(`Approved Sub-ARO with ID ${subAroId} not found`);
      }
    }

    if (createModificationDto.details && createModificationDto.details.length > 0) {
      for (const detail of createModificationDto.details) {
        const isAdd = detail.action === ModificationAction.ADD;

        if (isAdd) {
          if (!detail.office_id || !detail.pap_id || !detail.rca_id) {
            throw new BadRequestException('office_id, pap_id, and rca_id are required when action is ADD');
          }
          await this.validateAddActionFields(detail.office_id, detail.pap_id, detail.rca_id);
          continue;
        }

        if (
          (detail.allotment_details_id && detail.sub_aro_details_id) ||
          (!detail.allotment_details_id && !detail.sub_aro_details_id)
        ) {
          throw new Error('Exactly one of allotment_details_id or sub_aro_details_id must be provided for each detail');
        }

        if (detail.allotment_details_id) {
          const allotmentDetailResult = await this.db
            .select()
            .from(schema.allotmentDetails)
            .where(eq(schema.allotmentDetails.id, detail.allotment_details_id));

          if (allotmentDetailResult.length === 0) {
            throw new NotFoundException(`Allotment detail with ID ${detail.allotment_details_id} not found`);
          }
        }

        if (detail.sub_aro_details_id) {
          const subAroDetailResult = await this.db
            .select()
            .from(schema.subAroDetails)
            .where(eq(schema.subAroDetails.id, detail.sub_aro_details_id));

          if (subAroDetailResult.length === 0) {
            throw new NotFoundException(`Sub-aro detail with ID ${detail.sub_aro_details_id} not found`);
          }
        }
      }
    }

    const existingModification = await this.db
      .select()
      .from(modifications)
      .where(eq(modifications.modification_code, createModificationDto.modification_code));

    if (existingModification.length > 0) {
      throw new ConflictException(`Modification code ${createModificationDto.modification_code} already exists`);
    }

    try {
      const modificationId = await this.db.transaction(async (tx) => {
        const [modification] = await tx
          .insert(modifications)
          .values({
            modification_code: createModificationDto.modification_code,
            user_id: userId,
            allotment_id: createModificationDto.allotment_id || null,
            sub_aro_id: createModificationDto.sub_aro_id || null,
            date: new Date(createModificationDto.date),
            particulars: createModificationDto.particulars,
            status: ModificationStatus.FOR_TRIAGE,
          } as NewModification)
          .returning();

        if (createModificationDto.details && createModificationDto.details.length > 0) {
          const detailsToInsert: NewModificationDetail[] = [];

          for (const detail of createModificationDto.details) {
            const isAdd = detail.action === ModificationAction.ADD;

            if (!isAdd) {
              const allotmentDetailsId = detail.allotment_details_id;
              const subAroDetailsId = detail.sub_aro_details_id;

              if ((allotmentDetailsId && subAroDetailsId) || (!allotmentDetailsId && !subAroDetailsId)) {
                throw new BadRequestException(
                  'Exactly one of allotment_details_id or sub_aro_details_id must be provided',
                );
              }

              if (createModificationDto.allotment_id && !allotmentDetailsId) {
                throw new BadRequestException(
                  'This modification is for an allotment and requires allotment_details_id',
                );
              }

              if (createModificationDto.sub_aro_id && !subAroDetailsId) {
                throw new BadRequestException('This modification is for a sub-aro and requires sub_aro_details_id');
              }

              if (allotmentDetailsId) {
                const allotmentDetailResult = await tx
                  .select({
                    id: schema.allotmentDetails.id,
                    allotment_id: schema.allotmentDetails.allotment_id,
                  })
                  .from(schema.allotmentDetails)
                  .where(eq(schema.allotmentDetails.id, allotmentDetailsId));

                if (allotmentDetailResult.length === 0) {
                  throw new NotFoundException(`Allotment detail with ID ${allotmentDetailsId} not found`);
                }

                if (allotmentDetailResult[0].allotment_id !== createModificationDto.allotment_id) {
                  throw new BadRequestException(
                    `Allotment detail with ID ${allotmentDetailsId} does not belong to the modification's allotment`,
                  );
                }
              }

              if (subAroDetailsId) {
                const subAroDetailResult = await tx
                  .select({
                    id: schema.subAroDetails.id,
                    sub_aro_id: schema.subAroDetails.sub_aro_id,
                  })
                  .from(schema.subAroDetails)
                  .where(eq(schema.subAroDetails.id, subAroDetailsId));

                if (subAroDetailResult.length === 0) {
                  throw new NotFoundException(`Sub-aro detail with ID ${subAroDetailsId} not found`);
                }

                if (subAroDetailResult[0].sub_aro_id !== createModificationDto.sub_aro_id) {
                  throw new BadRequestException(
                    `Sub-aro detail with ID ${subAroDetailsId} does not belong to the modification's sub-aro`,
                  );
                }
              }
            }

            detailsToInsert.push({
              user_id: userId,
              modification_id: modification.id,
              allotment_details_id: isAdd ? null : detail.allotment_details_id,
              sub_aro_details_id: isAdd ? null : detail.sub_aro_details_id,
              office_id: isAdd ? detail.office_id : null,
              pap_id: isAdd ? detail.pap_id : null,
              rca_id: isAdd ? detail.rca_id : null,
              action: detail.action,
              amount: detail.amount * 100,
            });
          }

          await tx.insert(modificationDetails).values(detailsToInsert).returning();
        }

        return modification.id;
      });

      return await this.findOne(modificationId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create modification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(
    paginationQuery: ModificationsPaginationQueryDto,
  ): Promise<{ data: ModificationResponseDto[]; totalItems: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      date,
      status,
      allotment_id,
      sortByDate,
      sortByModificationCode,
    } = paginationQuery;
    const offset = (page - 1) * limit;

    const baseConditions: SQL[] = [];

    if (status) {
      baseConditions.push(eq(modifications.status, status));
    }

    if (allotment_id) {
      baseConditions.push(eq(modifications.allotment_id, allotment_id));
    }

    if (date) {
      const dates = date.split(',').map((d) => d.trim());
      if (dates.length === 1) {
        const startOfDay = new Date(dates[0]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dates[0]);
        endOfDay.setHours(23, 59, 59, 999);
        baseConditions.push(between(modifications.date, startOfDay, endOfDay));
      } else if (dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);
        baseConditions.push(between(modifications.date, startDate, endDate));
      }
    }

    const allotmentConditions: SQL[] = [...baseConditions];
    const subAroConditions: SQL[] = [...baseConditions];

    if (search) {
      const allotmentSearchCondition = or(
        ilike(modifications.modification_code, `%${search}%`),
        ilike(modifications.particulars, `%${search}%`),
        ilike(schema.allotments.allotment_code, `%${search}%`),
      );
      if (allotmentSearchCondition) {
        allotmentConditions.push(allotmentSearchCondition);
      }

      const subAroSearchCondition = or(
        ilike(modifications.modification_code, `%${search}%`),
        ilike(modifications.particulars, `%${search}%`),
        ilike(schema.subAros.sub_aro_code, `%${search}%`),
      );
      if (subAroSearchCondition) {
        subAroConditions.push(subAroSearchCondition);
      }
    }

    const allotmentWhereConditions = allotmentConditions.length > 0 ? and(...allotmentConditions) : undefined;
    const subAroWhereConditions = subAroConditions.length > 0 ? and(...subAroConditions) : undefined;

    const orderByClause: SQL[] = [];

    if (sortByModificationCode) {
      orderByClause.push(
        sortByModificationCode === 'asc' ? asc(modifications.modification_code) : desc(modifications.modification_code),
      );
    }

    if (sortByDate) {
      orderByClause.push(sortByDate === 'asc' ? asc(modifications.date) : desc(modifications.date));
    }

    orderByClause.push(asc(modifications.created_at));

    const [allotmentModifications, subAroModifications, [{ value: totalItems }]] = await Promise.all([
      this.getAllotmentModificationsWithDetailsQuery()
        .where(allotmentWhereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.getSubAroModificationsWithDetailsQuery()
        .where(subAroWhereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(modifications)
        .leftJoin(schema.allotments, eq(modifications.allotment_id, schema.allotments.id))
        .leftJoin(schema.subAros, eq(modifications.sub_aro_id, schema.subAros.id))
        .where(
          baseConditions.length > 0
            ? and(
                ...baseConditions,
                search
                  ? or(
                      ilike(modifications.modification_code, `%${search}%`),
                      ilike(modifications.particulars, `%${search}%`),
                      ilike(schema.allotments.allotment_code, `%${search}%`),
                      ilike(schema.subAros.sub_aro_code, `%${search}%`),
                    )
                  : undefined,
              )
            : search
              ? or(
                  ilike(modifications.modification_code, `%${search}%`),
                  ilike(modifications.particulars, `%${search}%`),
                  ilike(schema.allotments.allotment_code, `%${search}%`),
                  ilike(schema.subAros.sub_aro_code, `%${search}%`),
                )
              : undefined,
        ),
    ]);

    const allData = [...allotmentModifications, ...subAroModifications];
    const data = this.processModificationsWithDetails(allData);

    return { data, totalItems };
  }

  async findOne(id: string): Promise<ModificationResponseDto> {
    const modification = await this.db.select().from(modifications).where(eq(modifications.id, id));

    if (modification.length === 0) {
      throw new NotFoundException(`Modification with ID ${id} not found`);
    }

    const modificationsWithDetails = modification[0].allotment_id
      ? await this.getAllotmentModificationsWithDetailsQuery()
          .where(eq(modifications.id, id))
          .orderBy(asc(modificationDetails.created_at))
      : await this.getSubAroModificationsWithDetailsQuery()
          .where(eq(modifications.id, id))
          .orderBy(asc(modificationDetails.created_at));

    const processed = this.processModificationsWithDetails(modificationsWithDetails);
    return processed[0];
  }

  async update(id: string, updateModificationDto: UpdateModificationDto): Promise<ModificationResponseDto> {
    const existingModification = await this.db.select().from(modifications).where(eq(modifications.id, id));

    if (existingModification.length === 0) {
      throw new NotFoundException(`Modification with ID ${id} not found`);
    }

    if (
      existingModification[0].status !== ModificationStatus.DRAFT &&
      existingModification[0].status !== ModificationStatus.FOR_PROCESSING
    ) {
      throw new UnprocessableEntityException(
        `Modification can only be updated when status is DRAFT or FOR_PROCESSING. Current status: ${existingModification[0].status}`,
      );
    }

    if (
      updateModificationDto.modification_code !== undefined &&
      updateModificationDto.modification_code !== existingModification[0].modification_code
    ) {
      const existingCode = await this.db
        .select()
        .from(modifications)
        .where(eq(modifications.modification_code, updateModificationDto.modification_code));

      if (existingCode.length > 0) {
        throw new ConflictException(`Modification code ${updateModificationDto.modification_code} already exists`);
      }
    }

    if (updateModificationDto.allotment_id) {
      const allotmentId = updateModificationDto.allotment_id;
      const allotmentResult = await this.db
        .select()
        .from(schema.allotments)
        .where(and(eq(schema.allotments.id, allotmentId), eq(schema.allotments.status, AllotmentStatus.APPROVED)));

      if (allotmentResult.length === 0) {
        throw new NotFoundException(`Approved allotment with ID ${allotmentId} not found`);
      }
    }

    if (updateModificationDto.sub_aro_id) {
      const subAroId = updateModificationDto.sub_aro_id;
      const subAroResult = await this.db
        .select()
        .from(schema.subAros)
        .where(and(eq(schema.subAros.id, subAroId), eq(schema.subAros.status, SubAroStatus.APPROVED)));

      if (subAroResult.length === 0) {
        throw new NotFoundException(`Approved Sub-ARO with ID ${subAroId} not found`);
      }
    }

    const updateData: Partial<NewModification> = {};

    if (updateModificationDto.modification_code !== undefined) {
      updateData.modification_code = updateModificationDto.modification_code;
    }
    if (updateModificationDto.allotment_id !== undefined) {
      updateData.allotment_id = updateModificationDto.allotment_id || null;
    }
    if (updateModificationDto.sub_aro_id !== undefined) {
      updateData.sub_aro_id = updateModificationDto.sub_aro_id || null;
    }
    if (updateModificationDto.date !== undefined) {
      updateData.date = new Date(updateModificationDto.date);
    }
    if (updateModificationDto.particulars !== undefined) {
      updateData.particulars = updateModificationDto.particulars;
    }

    try {
      const result = await this.db
        .update(modifications)
        .set(updateData)
        .where(
          and(
            eq(modifications.id, id),
            or(
              eq(modifications.status, ModificationStatus.DRAFT),
              eq(modifications.status, ModificationStatus.FOR_PROCESSING),
            ),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update modification with ID ${id}`);
      }

      const updatedModification = result[0];

      return await this.findOne(updatedModification.id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update modification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async updateStatus(id: string, status: ModificationStatus): Promise<ModificationResponseDto> {
    const existingModification = await this.db.select().from(modifications).where(eq(modifications.id, id));

    if (existingModification.length === 0) {
      throw new NotFoundException(`Modification with ID ${id} not found`);
    }

    const result = await this.db.update(modifications).set({ status }).where(eq(modifications.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update modification status with ID ${id}`);
    }

    const updatedModification = result[0];

    return this.findOne(updatedModification.id);
  }
}
