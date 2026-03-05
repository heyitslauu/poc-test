import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateObligationDetailDto } from '../dtos/create-obligation-detail.dto';
import { UpdateObligationDetailDto } from '../dtos/update-obligation-detail.dto';
import { ObligationDetailResponseDto } from '../dtos/obligation-detail-response.dto';
import { ObligationDetailsPaginationQueryDto } from '../dtos/obligation-details-pagination.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import * as schema from '../../../database/schemas';
import { AllotmentStatus } from '../../../database/schemas/allotments.schema';
import { obligationDetails, NewObligationDetail } from '../../../database/schemas/obligation-details.schema';
import { disbursementObligations } from '../../../database/schemas/disbursement-obligations.schema';

interface RawObligationDetail {
  id: string;
  user_id: string;
  obligation_id: string;
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
export class ObligationDetailsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private mapToObligationDetailResponseDto(rawDetail: RawObligationDetail): ObligationDetailResponseDto {
    return plainToInstance(ObligationDetailResponseDto, {
      ...rawDetail,
      amount: rawDetail.amount,
      office: rawDetail.office ? plainToInstance(OfficeResponseDto, rawDetail.office) : undefined,
      pap: rawDetail.pap ? plainToInstance(PapResponseDto, rawDetail.pap) : undefined,
      rca: rawDetail.rca ? plainToInstance(RcaResponseDto, rawDetail.rca) : undefined,
    });
  }

  private async getObligationDetailsRaw(
    whereConditions: SQL[],
    limit?: number,
    offset?: number,
  ): Promise<RawObligationDetail[]> {
    const query = this.db
      .select({
        id: obligationDetails.id,
        user_id: obligationDetails.user_id,
        obligation_id: obligationDetails.obligation_id,
        allotment_details_id: obligationDetails.allotment_details_id,
        allotment_code: schema.allotments.allotment_code,
        amount: obligationDetails.amount,
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
        created_at: obligationDetails.created_at,
        updated_at: obligationDetails.updated_at,
      })
      .from(obligationDetails)
      .leftJoin(schema.allotmentDetails, eq(obligationDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(schema.allotments, eq(schema.allotmentDetails.allotment_id, schema.allotments.id))
      .leftJoin(schema.fieldOffices, eq(schema.allotmentDetails.office_id, schema.fieldOffices.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .where(and(...whereConditions));

    if (limit !== undefined) {
      query.orderBy(desc(obligationDetails.created_at)).limit(limit);
      if (offset !== undefined) {
        query.offset(offset);
      }
    }

    return await query;
  }

  async create(createObligationDetailDto: CreateObligationDetailDto): Promise<ObligationDetailResponseDto> {
    const obligationResult = await this.db
      .select()
      .from(schema.obligations)
      .where(eq(schema.obligations.id, createObligationDetailDto.obligation_id));

    if (obligationResult.length === 0) {
      throw new NotFoundException(`Obligation with ID ${createObligationDetailDto.obligation_id} not found`);
    }

    if (obligationResult[0].fund_cluster === null) {
      throw new NotFoundException(
        `Obligation with ID ${createObligationDetailDto.obligation_id} has no fund cluster assigned`,
      );
    }

    const allotmentResult = await this.db
      .select()
      .from(schema.allotmentDetails)
      .leftJoin(schema.allotments, eq(schema.allotmentDetails.allotment_id, schema.allotments.id))
      .where(
        and(
          eq(schema.allotmentDetails.id, createObligationDetailDto.allotment_details_id),
          eq(schema.allotments.status, AllotmentStatus.APPROVED),
        ),
      );

    if (allotmentResult.length === 0) {
      throw new NotFoundException(
        `Allotment details with ID ${createObligationDetailDto.allotment_details_id} not found or not approved`,
      );
    }

    if (allotmentResult[0].allotments?.fund_cluster !== obligationResult[0].fund_cluster) {
      throw new NotFoundException(
        `Allotment details with ID ${createObligationDetailDto.allotment_details_id} fund cluster does not match the obligation`,
      );
    }

    try {
      const [obligationDetail] = await this.db
        .insert(obligationDetails)
        .values({
          user_id: createObligationDetailDto.user_id,
          obligation_id: createObligationDetailDto.obligation_id,
          allotment_details_id: createObligationDetailDto.allotment_details_id,
          amount: createObligationDetailDto.amount * 100,
        } as NewObligationDetail)
        .returning();

      return await this.findOne(obligationDetail.id);
    } catch (error) {
      throw new Error(`Failed to create obligation detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(
    obligationId: string,
    paginationQuery: ObligationDetailsPaginationQueryDto,
  ): Promise<{ data: ObligationDetailResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, allotment_details_id, user_id } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(obligationDetails.obligation_id, obligationId)];

    if (allotment_details_id) {
      conditions.push(eq(obligationDetails.allotment_details_id, allotment_details_id));
    }
    if (user_id) {
      conditions.push(eq(obligationDetails.user_id, user_id));
    }

    const whereConditions = and(...conditions);

    const [obligationDetailsData, [{ value: totalItems }]] = await Promise.all([
      this.getObligationDetailsRaw(conditions, limit, offset),
      this.db.select({ value: count() }).from(obligationDetails).where(whereConditions),
    ]);

    const data = obligationDetailsData.map((detail) => this.mapToObligationDetailResponseDto(detail));

    return { data, totalItems };
  }

  async findOne(id: string): Promise<ObligationDetailResponseDto> {
    const result = await this.getObligationDetailsRaw([eq(obligationDetails.id, id)], 1);

    if (result.length === 0) {
      throw new NotFoundException(`Obligation detail with ID ${id} not found`);
    }

    return this.mapToObligationDetailResponseDto(result[0]);
  }

  async update(id: string, updateObligationDetailDto: UpdateObligationDetailDto): Promise<ObligationDetailResponseDto> {
    const existingDetail = await this.db.select().from(obligationDetails).where(eq(obligationDetails.id, id));

    if (existingDetail.length === 0) {
      throw new NotFoundException(`Obligation detail with ID ${id} not found`);
    }

    const updateData: Partial<NewObligationDetail> = {};

    if (updateObligationDetailDto.obligation_id !== undefined) {
      updateData.obligation_id = updateObligationDetailDto.obligation_id;
    }
    if (updateObligationDetailDto.allotment_details_id !== undefined) {
      updateData.allotment_details_id = updateObligationDetailDto.allotment_details_id;
    }
    if (updateObligationDetailDto.amount !== undefined) {
      updateData.amount = updateObligationDetailDto.amount * 100;
    }
    if (updateObligationDetailDto.user_id !== undefined) {
      updateData.user_id = updateObligationDetailDto.user_id;
    }

    try {
      const result = await this.db
        .update(obligationDetails)
        .set(updateData)
        .where(eq(obligationDetails.id, id))
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update obligation detail with ID ${id}`);
      }

      return await this.findOne(id);
    } catch (error) {
      throw new Error(`Failed to update obligation detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: string): Promise<void> {
    const existingDetail = await this.db.select().from(obligationDetails).where(eq(obligationDetails.id, id));

    if (existingDetail.length === 0) {
      throw new NotFoundException(`Obligation detail with ID ${id} not found`);
    }

    try {
      await this.db.delete(obligationDetails).where(eq(obligationDetails.id, id));
    } catch (error) {
      throw new Error(`Failed to delete obligation detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findByDisbursementId(disbursementId: string) {
    const obligations = await this.db
      .select({
        id: obligationDetails.id,
        user_id: obligationDetails.user_id,
        obligation_id: schema.obligations.id,
        ors_number: schema.obligations.ors_number,
        particulars: schema.obligations.particulars,
        fund_cluster: schema.obligations.fund_cluster,
        payee_id: schema.payees.id,
        payee_name: schema.payees.name,
        payee_type: schema.payees.type,
        allotment_details_id: obligationDetails.allotment_details_id,
        allotment_code: schema.allotments.allotment_code,
        office_id: schema.allotmentDetails.office_id,
        pap_id: schema.allotmentDetails.pap_id,
        pap_code: schema.paps.code,
        pap_name: schema.paps.name,
        pap_is_active: schema.paps.is_active,
        rca_id: schema.allotmentDetails.rca_id,
        rca_code: schema.revisedChartOfAccounts.code,
        rca_name: schema.revisedChartOfAccounts.name,
        rca_is_active: schema.revisedChartOfAccounts.is_active,
        rca_allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
        amount: obligationDetails.amount,
        created_at: obligationDetails.created_at,
        updated_at: obligationDetails.updated_at,
      })
      .from(disbursementObligations)
      .leftJoin(obligationDetails, eq(disbursementObligations.obligation_detail_id, obligationDetails.id))
      .leftJoin(schema.obligations, eq(obligationDetails.obligation_id, schema.obligations.id))
      .leftJoin(schema.payees, eq(schema.obligations.payee_id, schema.payees.id))
      .leftJoin(schema.allotmentDetails, eq(obligationDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(schema.allotments, eq(schema.allotmentDetails.allotment_id, schema.allotments.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .where(eq(disbursementObligations.disbursement_id, disbursementId));

    return obligations.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      obligation: {
        id: item.obligation_id,
        ors_number: item.ors_number,
        particulars: item.particulars,
        fund_cluster: item.fund_cluster,
        payee: {
          id: item.payee_id,
          name: item.payee_name,
          type: item.payee_type,
        },
      },
      allotment_details: {
        id: item.allotment_details_id,
        allotment_code: item.allotment_code,
        office_id: item.office_id,
        pap: item.pap_id
          ? {
              id: item.pap_id,
              code: item.pap_code,
              name: item.pap_name,
              is_active: item.pap_is_active,
            }
          : null,
        rca: item.rca_id
          ? {
              id: item.rca_id,
              code: item.rca_code,
              name: item.rca_name,
              is_active: item.rca_is_active,
              allows_sub_object: item.rca_allows_sub_object,
            }
          : null,
      },
      amount: item.amount ? item.amount / 100 : 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }
}
