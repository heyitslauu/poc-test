import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, count, ilike, or, sql, and, SQL, between, inArray, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { CreateAllotmentDto } from './dto/create-allotment.dto';
import { UpdateAllotmentDto } from './dto/update-allotment.dto';
import { DATABASE_CONNECTION } from '../../config/database.config';
import * as schema from '../../database/schemas';
import {
  allotments,
  allotmentDrafts,
  NewAllotment,
  Allotment,
  AllotmentStatus,
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
  allotmentDetails,
  fieldOffices,
  paps,
  revisedChartOfAccounts,
  rcaSubObjects,
} from '../../database/schemas';
import { plainToInstance } from 'class-transformer';
import { AllotmentResponseDto } from './dto/allotment-response.dto';
import { AllotmentDetailResponseDto } from './dto/allotment-detail-response.dto';
import { AllotmentDraftResponseDto } from './dto/allotment-draft-response.dto';
import { validate } from 'class-validator';
import { ValidateDraftSubmissionDto } from './dto/validate-draft-submission.dto';
import { formatValidationErrors } from '../../common/utils/validation.util';

@Injectable()
export class AllotmentsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private async getAllotmentDetails(allotmentIds: string[]) {
    return await this.db
      .select({
        allotment_id: allotmentDetails.allotment_id,
        id: allotmentDetails.id,
        user_id: allotmentDetails.user_id,
        office_id: allotmentDetails.office_id,
        office: {
          id: fieldOffices.id,
          code: fieldOffices.code,
          name: fieldOffices.name,
          is_active: fieldOffices.is_active,
        },
        pap_id: allotmentDetails.pap_id,
        pap: {
          id: paps.id,
          code: paps.code,
          name: paps.name,
          is_active: paps.is_active,
        },
        rca_id: allotmentDetails.rca_id,
        rca: {
          id: revisedChartOfAccounts.id,
          code: revisedChartOfAccounts.code,
          name: revisedChartOfAccounts.name,
          is_active: revisedChartOfAccounts.is_active,
          allows_sub_object: revisedChartOfAccounts.allows_sub_object,
        },
        rca_sub_object_id: allotmentDetails.rca_sub_object_id,
        rca_sub_object: {
          id: rcaSubObjects.id,
          code: rcaSubObjects.code,
          name: rcaSubObjects.name,
          is_active: rcaSubObjects.is_active,
        },
        amount: allotmentDetails.amount,
      })
      .from(allotmentDetails)
      .leftJoin(fieldOffices, eq(allotmentDetails.office_id, fieldOffices.id))
      .leftJoin(paps, eq(allotmentDetails.pap_id, paps.id))
      .leftJoin(revisedChartOfAccounts, eq(allotmentDetails.rca_id, revisedChartOfAccounts.id))
      .leftJoin(rcaSubObjects, eq(allotmentDetails.rca_sub_object_id, rcaSubObjects.id))
      .where(inArray(allotmentDetails.allotment_id, allotmentIds));
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: {
      date?: string;
      fund_cluster?: FundCluster;
      appropriation_type?: AppropriationType;
      bfars_budget_type?: BfarsBudgetType;
      allotment_type?: AllotmentType;
      status?: AllotmentStatus;
    },
  ): Promise<{ data: AllotmentResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? or(
          ilike(allotments.tracking_reference, `%${search}%`),
          ilike(allotments.allotment_code, `%${search}%`),
          ilike(allotments.particulars, `%${search}%`),
          ilike(allotments.remarks, `%${search}%`),
          ilike(sql`${allotments.total_allotment}::text`, `%${search}%`),
          ilike(sql`(${allotments.total_allotment} / 100.0)::numeric(20, 2)::text`, `%${search}%`),
          ...(!filters?.date ? [ilike(sql`${allotments.date}::text`, `%${search}%`)] : []),
          ...(!filters?.fund_cluster ? [ilike(sql`${allotments.fund_cluster}::text`, `%${search}%`)] : []),
          ...(!filters?.appropriation_type ? [ilike(sql`${allotments.appropriation_type}::text`, `%${search}%`)] : []),
          ...(!filters?.bfars_budget_type ? [ilike(sql`${allotments.bfars_budget_type}::text`, `%${search}%`)] : []),
          ...(!filters?.allotment_type ? [ilike(sql`${allotments.allotment_type}::text`, `%${search}%`)] : []),
        )
      : undefined;

    const parseDateFilter = (dateStr: string): SQL | undefined => {
      const parts = dateStr.split(',').map((d) => d.trim());
      if (parts.length === 2) {
        return between(allotments.date, new Date(parts[0]), new Date(parts[1]));
      }
      return sql`DATE(${allotments.date}) = DATE(${new Date(parts[0])})`;
    };

    const filterCondition = and(
      ...(filters?.date ? [parseDateFilter(filters.date)] : []),
      ...(filters?.fund_cluster ? [eq(allotments.fund_cluster, filters.fund_cluster)] : []),
      ...(filters?.appropriation_type ? [eq(allotments.appropriation_type, filters.appropriation_type)] : []),
      ...(filters?.bfars_budget_type ? [eq(allotments.bfars_budget_type, filters.bfars_budget_type)] : []),
      ...(filters?.allotment_type ? [eq(allotments.allotment_type, filters.allotment_type)] : []),
      ...(filters?.status ? [eq(allotments.status, filters.status)] : []),
    );

    const whereCondition = and(searchCondition, filterCondition);

    const [allotmentsList, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select()
        .from(allotments)
        .where(whereCondition)
        .orderBy(desc(allotments.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(allotments).where(whereCondition),
    ]);

    if (allotmentsList.length > 0) {
      const allotmentIds = allotmentsList.map((a) => a.id);
      const allotmentDetailsResult = await this.getAllotmentDetails(allotmentIds);

      const detailsMap = new Map<string, AllotmentDetailResponseDto[]>();
      allotmentDetailsResult.forEach((detail) => {
        const processedDetail = {
          ...detail,
          rca_sub_object: detail.rca_sub_object_id ? detail.rca_sub_object : null,
        };
        const details = detailsMap.get(detail.allotment_id);
        if (details) {
          details.push(processedDetail as AllotmentDetailResponseDto);
        } else {
          detailsMap.set(detail.allotment_id, [processedDetail as AllotmentDetailResponseDto]);
        }
      });

      allotmentsList.forEach((allotment) => {
        (allotment as Record<string, unknown>).uacs = detailsMap.get(allotment.id) || [];
      });
    }

    return { data: plainToInstance(AllotmentResponseDto, allotmentsList), totalItems };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(allotments).where(eq(allotments.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Allotment with ID ${id} not found`);
    }

    const allotmentDetailsResult = await this.getAllotmentDetails([id]);

    const processedDetails = allotmentDetailsResult.map((detail) => ({
      ...detail,
      rca_sub_object: detail.rca_sub_object_id ? detail.rca_sub_object : null,
    }));

    const allotment = plainToInstance(AllotmentResponseDto, {
      ...result[0],
      uacs: processedDetails,
    });

    return allotment;
  }

  async update(id: string, updateAllotmentDto: UpdateAllotmentDto) {
    const existingAllotment = await this.db.select().from(allotments).where(eq(allotments.id, id));

    if (existingAllotment.length === 0) {
      throw new NotFoundException(`Allotment with ID ${id} not found`);
    }

    if (existingAllotment[0].status !== AllotmentStatus.FOR_PROCESSING) {
      throw new UnprocessableEntityException(
        `Allotment can only be updated when status is FOR_PROCESSING. Current status: ${existingAllotment[0].status}`,
      );
    }

    const updateData: Partial<NewAllotment> = {};

    if (updateAllotmentDto.allotment_code) updateData.allotment_code = updateAllotmentDto.allotment_code;
    if (updateAllotmentDto.date) updateData.date = new Date(updateAllotmentDto.date);
    if (updateAllotmentDto.fund_cluster) updateData.fund_cluster = updateAllotmentDto.fund_cluster;
    if (updateAllotmentDto.particulars) updateData.particulars = updateAllotmentDto.particulars;
    if (updateAllotmentDto.appropriation_type) updateData.appropriation_type = updateAllotmentDto.appropriation_type;
    if (updateAllotmentDto.bfars_budget_type) updateData.bfars_budget_type = updateAllotmentDto.bfars_budget_type;
    if (updateAllotmentDto.allotment_type) updateData.allotment_type = updateAllotmentDto.allotment_type;
    if (updateAllotmentDto.total_allotment !== undefined)
      updateData.total_allotment = updateAllotmentDto.total_allotment * 100;
    if (updateAllotmentDto.remarks !== undefined) updateData.remarks = updateAllotmentDto.remarks;
    if (updateAllotmentDto.workflow_id !== undefined) updateData.workflow_id = updateAllotmentDto.workflow_id;

    const result = await this.db
      .update(allotments)
      .set(updateData)
      .where(and(eq(allotments.id, id), eq(allotments.status, AllotmentStatus.FOR_PROCESSING)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update allotment with ID ${id}`);
    }

    return plainToInstance(AllotmentResponseDto, result[0]);
  }

  async updateStatus(id: string, status: AllotmentStatus) {
    const existingAllotment = await this.db.select().from(allotments).where(eq(allotments.id, id));

    if (existingAllotment.length === 0) {
      throw new NotFoundException(`Allotment with ID ${id} not found`);
    }

    const result = await this.db.update(allotments).set({ status }).where(eq(allotments.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update allotment status with ID ${id}`);
    }

    return plainToInstance(AllotmentResponseDto, result[0]);
  }

  async findAllDrafts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: {
      date?: string;
      fund_cluster?: FundCluster;
      appropriation_type?: AppropriationType;
      bfars_budget_type?: BfarsBudgetType;
      allotment_type?: AllotmentType;
    },
  ): Promise<{ data: AllotmentDraftResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? or(
          ilike(allotmentDrafts.particulars, `%${search}%`),
          ilike(allotmentDrafts.remarks, `%${search}%`),
          ilike(sql`${allotmentDrafts.total_allotment}::text`, `%${search}%`),
          ilike(sql`(${allotmentDrafts.total_allotment} / 100.0)::numeric(20, 2)::text`, `%${search}%`),
          ...(!filters?.date ? [ilike(sql`${allotmentDrafts.date}::text`, `%${search}%`)] : []),
          ...(!filters?.fund_cluster ? [ilike(sql`${allotmentDrafts.fund_cluster}::text`, `%${search}%`)] : []),
          ...(!filters?.appropriation_type
            ? [ilike(sql`${allotmentDrafts.appropriation_type}::text`, `%${search}%`)]
            : []),
          ...(!filters?.bfars_budget_type
            ? [ilike(sql`${allotmentDrafts.bfars_budget_type}::text`, `%${search}%`)]
            : []),
          ...(!filters?.allotment_type ? [ilike(sql`${allotmentDrafts.allotment_type}::text`, `%${search}%`)] : []),
        )
      : undefined;

    const parseDateFilter = (dateStr: string): SQL | undefined => {
      const parts = dateStr.split(',').map((d) => d.trim());
      if (parts.length === 2) {
        return between(allotmentDrafts.date, new Date(parts[0]), new Date(parts[1]));
      }
      return sql`DATE(${allotmentDrafts.date}) = DATE(${new Date(parts[0])})`;
    };

    const filterCondition = and(
      ...(filters?.date ? [parseDateFilter(filters.date)] : []),
      ...(filters?.fund_cluster ? [eq(allotmentDrafts.fund_cluster, filters.fund_cluster)] : []),
      ...(filters?.appropriation_type ? [eq(allotmentDrafts.appropriation_type, filters.appropriation_type)] : []),
      ...(filters?.bfars_budget_type ? [eq(allotmentDrafts.bfars_budget_type, filters.bfars_budget_type)] : []),
      ...(filters?.allotment_type ? [eq(allotmentDrafts.allotment_type, filters.allotment_type)] : []),
    );

    const whereCondition = and(searchCondition, filterCondition);

    const [draftsList, [{ value: totalItems }]] = await Promise.all([
      this.db.select().from(allotmentDrafts).where(whereCondition).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(allotmentDrafts).where(whereCondition),
    ]);

    return { data: plainToInstance(AllotmentDraftResponseDto, draftsList), totalItems };
  }

  async findOneDraft(id: string) {
    const result = await this.db.select().from(allotmentDrafts).where(eq(allotmentDrafts.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Allotment draft with ID ${id} not found`);
    }

    return plainToInstance(AllotmentDraftResponseDto, result[0]);
  }

  async create(userId: string, createAllotmentDto: CreateAllotmentDto): Promise<AllotmentResponseDto> {
    return await this.db.transaction(async (tx) => {
      const dtoWithUser = Object.assign({}, createAllotmentDto, { user_id: userId });

      const validationDto = await this.validateDraftData(dtoWithUser);

      const existingAllotment = await tx
        .select()
        .from(allotments)
        .where(sql`lower(${allotments.allotment_code}) = lower(${validationDto.allotment_code})`);
      if (existingAllotment.length > 0) {
        throw new UnprocessableEntityException(`Allotment code ${validationDto.allotment_code} already exists`);
      }

      let allotment: Allotment | undefined;
      const maxRetries = 2;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          [allotment] = await tx
            .insert(allotments)
            .values({
              user_id: validationDto.user_id,
              allotment_code: validationDto.allotment_code,
              tracking_reference: this.generateTrackingReference(),
              date: validationDto.date,
              fund_cluster: validationDto.fund_cluster,
              particulars: validationDto.particulars,
              appropriation_type: validationDto.appropriation_type,
              bfars_budget_type: validationDto.bfars_budget_type,
              allotment_type: validationDto.allotment_type,
              total_allotment: validationDto.total_allotment * 100,
              workflow_id: validationDto.workflow_id ?? null,
              status: AllotmentStatus.FOR_TRIAGE,
              remarks: validationDto.remarks ?? null,
              created_at: new Date(),
              updated_at: new Date(),
            } as NewAllotment)
            .returning();

          break;
        } catch (error) {
          if (error instanceof Error && this.isTrackingReferenceConflict(error)) {
            if (attempt === maxRetries - 1) {
              throw new InternalServerErrorException(
                'Failed to generate unique tracking reference after multiple attempts',
              );
            }
            continue;
          }
          throw error;
        }
      }

      if (!allotment) {
        throw new InternalServerErrorException('Unexpected error: Allotment was not created');
      }

      return plainToInstance(AllotmentResponseDto, allotment);
    });
  }

  private async validateDraftData(draft: CreateAllotmentDto): Promise<ValidateDraftSubmissionDto> {
    const validationDto = plainToInstance(ValidateDraftSubmissionDto, draft);
    const errors = await validate(validationDto);

    if (errors.length > 0) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        details: formatValidationErrors(errors),
      });
    }

    return validationDto;
  }

  private isTrackingReferenceConflict(error: Error): boolean {
    return (
      'code' in error &&
      (error as Error & { code: string }).code === '23505' &&
      'detail' in error &&
      typeof (error as Error & { detail?: string }).detail === 'string' &&
      (error as Error & { detail: string }).detail.includes('tracking_reference')
    );
  }

  private generateTrackingReference(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month: string = String(now.getMonth() + 1).padStart(2, '0');

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(8);
    let randomChars = '';
    for (let i = 0; i < 8; i++) {
      const byteValue = bytes[i];
      randomChars += chars[byteValue % chars.length];
    }

    return `EX-${String(year)}-${month}-${randomChars}`;
  }

  async updateWorkflowId(id: string, workflowId: string): Promise<AllotmentResponseDto> {
    const existingAllotment = await this.db.select().from(allotments).where(eq(allotments.id, id));

    if (existingAllotment.length === 0) {
      throw new NotFoundException(`Allotment with ID ${id} not found`);
    }

    const result = await this.db
      .update(allotments)
      .set({ workflow_id: workflowId, updated_at: new Date() })
      .where(eq(allotments.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update allotment workflow ID with ID ${id}`);
    }

    return plainToInstance(AllotmentResponseDto, result[0]);
  }
}
