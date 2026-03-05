import { ConflictException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, count, desc, asc, between, SQL, sql } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateSubAroDto } from '../dto/create-sub-aro.dto';
import { UpdateSubAroDto } from '../dto/update-sub-aro.dto';
import { SubAroResponseDto } from '../dto/sub-aro-response.dto';
import { SubAroPaginationQueryDto } from '../dto/sub-aro-pagination.dto';
import { SubAroDetailsResponseDto } from '../dto/sub-aro-details-response.dto';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import { SubObjectResponseDto } from '../../rca/dto/sub-object-response.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { subAros, NewSubAro, SubAroStatus } from '../../../database/schemas/sub-aro.schema';
import { AllotmentStatus } from '../../../database/schemas/allotments.schema';

@Injectable()
export class SubAroService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: string, createSubAroDto: CreateSubAroDto): Promise<SubAroResponseDto> {
    const result = await this.db
      .select()
      .from(schema.allotments)
      .where(
        and(
          eq(schema.allotments.id, createSubAroDto.allotment_id),
          eq(schema.allotments.status, AllotmentStatus.APPROVED),
        ),
      );

    if (result.length === 0) {
      throw new NotFoundException(`Approved allotment with ID ${createSubAroDto.allotment_id} not found`);
    }

    const existingCode = await this.db
      .select()
      .from(subAros)
      .where(sql`lower(${subAros.sub_aro_code}) = ${createSubAroDto.sub_aro_code.toLowerCase()}`)
      .limit(1);

    if (existingCode.length > 0) {
      throw new ConflictException(`Sub-aro code ${createSubAroDto.sub_aro_code} already exists`);
    }

    try {
      const [subAro] = await this.db
        .insert(subAros)
        .values({
          user_id: userId,
          office_id: createSubAroDto.office_id,
          allotment_id: createSubAroDto.allotment_id,
          sub_aro_code: createSubAroDto.sub_aro_code,
          date: new Date(createSubAroDto.date),
          particulars: createSubAroDto.particulars,
          status: SubAroStatus.FOR_TRIAGE,
        } as NewSubAro)
        .returning();

      return await this.findOne(subAro.id);
    } catch (error) {
      throw new Error(`Failed to create sub-aro: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAll(paginationQuery: SubAroPaginationQueryDto): Promise<{ data: SubAroResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, search, date, status, sortByDate, sortByCode } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        sql`${subAros.sub_aro_code} ILIKE ${`%${search}%`} OR ${schema.fieldOffices.name} ILIKE ${`%${search}%`} OR ${subAros.particulars} ILIKE ${`%${search}%`}`,
      );
    }

    if (status) {
      conditions.push(eq(subAros.status, status as SubAroStatus));
    }

    if (date) {
      const dates = date.split(',').map((d) => d.trim());
      if (dates.length === 1) {
        const startOfDay = new Date(dates[0]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dates[0]);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(between(subAros.date, startOfDay, endOfDay));
      } else if (dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(between(subAros.date, startDate, endDate));
      }
    }

    const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause: SQL[] = [];

    if (sortByCode) {
      orderByClause.push(sortByCode === 'asc' ? asc(subAros.sub_aro_code) : desc(subAros.sub_aro_code));
    }

    if (sortByDate) {
      orderByClause.push(sortByDate === 'asc' ? asc(subAros.date) : desc(subAros.date));
    }

    orderByClause.push(desc(subAros.created_at));

    const [subArosData, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select({
          id: subAros.id,
          user_id: subAros.user_id,
          office_id: subAros.office_id,
          allotment_id: subAros.allotment_id,
          allotment_code: schema.allotments.allotment_code,
          sub_aro_code: subAros.sub_aro_code,
          date: subAros.date,
          particulars: subAros.particulars,
          status: subAros.status,
          created_at: subAros.created_at,
          updated_at: subAros.updated_at,
          office_code: schema.fieldOffices.code,
          office_name: schema.fieldOffices.name,
          office_is_active: schema.fieldOffices.is_active,
        })
        .from(subAros)
        .leftJoin(schema.fieldOffices, eq(subAros.office_id, schema.fieldOffices.id))
        .leftJoin(schema.allotments, eq(subAros.allotment_id, schema.allotments.id))
        .where(whereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(subAros)
        .leftJoin(schema.fieldOffices, eq(subAros.office_id, schema.fieldOffices.id))
        .leftJoin(schema.allotments, eq(subAros.allotment_id, schema.allotments.id))
        .where(whereConditions),
    ]);

    const data = subArosData.map((subAro) =>
      plainToInstance(SubAroResponseDto, {
        id: subAro.id,
        user_id: subAro.user_id,
        office_id: subAro.office_id,
        allotment_id: subAro.allotment_id,
        allotment_code: subAro.allotment_code,
        sub_aro_code: subAro.sub_aro_code,
        date: subAro.date,
        particulars: subAro.particulars,
        status: subAro.status,
        created_at: subAro.created_at,
        updated_at: subAro.updated_at,
        office: subAro.office_code
          ? plainToInstance(OfficeResponseDto, {
              id: subAro.office_id,
              code: subAro.office_code,
              name: subAro.office_name,
              is_active: subAro.office_is_active,
            })
          : undefined,
      }),
    );

    return { data, totalItems };
  }

  async findOne(id: string): Promise<SubAroResponseDto> {
    const subAroResult = await this.db
      .select({
        id: subAros.id,
        user_id: subAros.user_id,
        office_id: subAros.office_id,
        allotment_id: subAros.allotment_id,
        allotment_code: schema.allotments.allotment_code,
        sub_aro_code: subAros.sub_aro_code,
        date: subAros.date,
        particulars: subAros.particulars,
        status: subAros.status,
        created_at: subAros.created_at,
        updated_at: subAros.updated_at,
        office_code: schema.fieldOffices.code,
        office_name: schema.fieldOffices.name,
        office_is_active: schema.fieldOffices.is_active,
      })
      .from(subAros)
      .leftJoin(schema.fieldOffices, eq(subAros.office_id, schema.fieldOffices.id))
      .leftJoin(schema.allotments, eq(subAros.allotment_id, schema.allotments.id))
      .where(eq(subAros.id, id));

    if (subAroResult.length === 0) {
      throw new NotFoundException(`Sub-aro with ID ${id} not found`);
    }

    const subAroRow = subAroResult[0];

    const detailsResult = await this.db
      .select({
        id: schema.subAroDetails.id,
        sub_aro_id: schema.subAroDetails.sub_aro_id,
        uacs_id: schema.subAroDetails.uacs_id,
        amount: schema.subAroDetails.amount,
        created_at: schema.subAroDetails.created_at,
        updated_at: schema.subAroDetails.updated_at,
        allotment_code: schema.allotments.allotment_code,

        pap_id: schema.allotmentDetails.pap_id,
        pap_code: schema.paps.code,
        pap_name: schema.paps.name,
        pap_is_active: schema.paps.is_active,

        rca_code: schema.revisedChartOfAccounts.code,
        rca_name: schema.revisedChartOfAccounts.name,
        rca_is_active: schema.revisedChartOfAccounts.is_active,
        rca_allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,

        rca_sub_object_id: schema.allotmentDetails.rca_sub_object_id,
        rca_sub_object_code: schema.rcaSubObjects.code,
        rca_sub_object_name: schema.rcaSubObjects.name,
        rca_sub_object_is_active: schema.rcaSubObjects.is_active,
        rca_id: schema.allotmentDetails.rca_id,
      })
      .from(schema.subAroDetails)
      .leftJoin(schema.subAros, eq(schema.subAroDetails.sub_aro_id, schema.subAros.id))
      .leftJoin(schema.allotments, eq(schema.subAros.allotment_id, schema.allotments.id))
      .leftJoin(schema.allotmentDetails, eq(schema.subAroDetails.uacs_id, schema.allotmentDetails.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(schema.allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .leftJoin(schema.rcaSubObjects, eq(schema.allotmentDetails.rca_sub_object_id, schema.rcaSubObjects.id))
      .where(eq(schema.subAroDetails.sub_aro_id, id));

    const details = detailsResult.map((row) =>
      plainToInstance(SubAroDetailsResponseDto, {
        id: row.id,
        sub_aro_id: row.sub_aro_id,
        uacs_id: row.uacs_id,
        allotment_code: row.allotment_code,
        amount: row.amount / 100,
        created_at: row.created_at,
        updated_at: row.updated_at,
        pap: row.pap_code
          ? plainToInstance(PapResponseDto, {
              id: row.pap_id,
              code: row.pap_code,
              name: row.pap_name,
              is_active: row.pap_is_active,
            })
          : undefined,
        rca: row.rca_code
          ? plainToInstance(RcaResponseDto, {
              id: row.rca_id,
              code: row.rca_code,
              name: row.rca_name,
              is_active: row.rca_is_active,
              allows_sub_object: row.rca_allows_sub_object,
            })
          : undefined,
        rca_sub_object_id: row.rca_sub_object_id,
        rca_sub_object: row.rca_sub_object_code
          ? plainToInstance(SubObjectResponseDto, {
              id: row.rca_sub_object_id,
              rca_id: row.rca_id,
              code: row.rca_sub_object_code,
              name: row.rca_sub_object_name,
              is_active: row.rca_sub_object_is_active,
            })
          : null,
      }),
    );

    const rest = {
      id: subAroRow.id,
      user_id: subAroRow.user_id,
      office_id: subAroRow.office_id,
      allotment_id: subAroRow.allotment_id,
      allotment_code: subAroRow.allotment_code,
      sub_aro_code: subAroRow.sub_aro_code,
      date: subAroRow.date,
      particulars: subAroRow.particulars,
      status: subAroRow.status,
      created_at: subAroRow.created_at,
      updated_at: subAroRow.updated_at,
    };

    return plainToInstance(SubAroResponseDto, {
      ...rest,
      office: subAroRow.office_code
        ? plainToInstance(OfficeResponseDto, {
            id: subAroRow.office_id,
            code: subAroRow.office_code,
            name: subAroRow.office_name,
            is_active: subAroRow.office_is_active,
          })
        : undefined,
      details,
    });
  }

  async update(id: string, updateSubAroDto: UpdateSubAroDto): Promise<SubAroResponseDto> {
    const existingSubAro = await this.db.select().from(subAros).where(eq(subAros.id, id));

    if (existingSubAro.length === 0) {
      throw new NotFoundException(`Sub-aro with ID ${id} not found`);
    }

    if (existingSubAro[0].status !== SubAroStatus.DRAFT && existingSubAro[0].status !== SubAroStatus.FOR_PROCESSING) {
      throw new UnprocessableEntityException(
        `Sub-aro can only be updated when status is DRAFT or FOR_PROCESSING. Current status: ${existingSubAro[0].status}`,
      );
    }

    if (updateSubAroDto.allotment_id) {
      const allotmentResult = await this.db
        .select()
        .from(schema.allotments)
        .where(
          and(
            eq(schema.allotments.id, updateSubAroDto.allotment_id),
            eq(schema.allotments.status, AllotmentStatus.APPROVED),
          ),
        );

      if (allotmentResult.length === 0) {
        throw new NotFoundException(`Approved allotment with ID ${updateSubAroDto.allotment_id} not found`);
      }
    }

    if (updateSubAroDto.sub_aro_code) {
      const existingCode = await this.db
        .select()
        .from(subAros)
        .where(
          and(
            sql`lower(${subAros.sub_aro_code}) = ${updateSubAroDto.sub_aro_code.toLowerCase()}`,
            sql`${subAros.id} != ${id}`,
          ),
        )
        .limit(1);

      if (existingCode.length > 0) {
        throw new ConflictException(`Sub-aro code ${updateSubAroDto.sub_aro_code} already exists`);
      }
    }

    const updateData: Partial<NewSubAro> = {};

    if (updateSubAroDto.allotment_id !== undefined) {
      updateData.allotment_id = updateSubAroDto.allotment_id;
    }
    if (updateSubAroDto.office_id !== undefined) {
      updateData.office_id = updateSubAroDto.office_id;
    }
    if (updateSubAroDto.sub_aro_code !== undefined) {
      updateData.sub_aro_code = updateSubAroDto.sub_aro_code;
    }
    if (updateSubAroDto.date !== undefined) {
      updateData.date = new Date(updateSubAroDto.date);
    }
    if (updateSubAroDto.particulars !== undefined) {
      updateData.particulars = updateSubAroDto.particulars;
    }

    try {
      const result = await this.db
        .update(subAros)
        .set(updateData)
        .where(
          and(
            eq(subAros.id, id),
            or(eq(subAros.status, SubAroStatus.DRAFT), eq(subAros.status, SubAroStatus.FOR_PROCESSING)),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update sub-aro with ID ${id}`);
      }

      return await this.findOne(id);
    } catch (error) {
      throw new Error(`Failed to update sub-aro: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateStatus(id: string, status: SubAroStatus): Promise<SubAroResponseDto> {
    const existingSubAro = await this.db.select().from(subAros).where(eq(subAros.id, id));

    if (existingSubAro.length === 0) {
      throw new NotFoundException(`Sub-aro with ID ${id} not found`);
    }

    const result = await this.db.update(subAros).set({ status }).where(eq(subAros.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update sub-aro status with ID ${id}`);
    }

    return await this.findOne(id);
  }
}
