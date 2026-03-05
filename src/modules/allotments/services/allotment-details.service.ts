import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, count, and, inArray, InferSelectModel } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { allotmentDetails, NewAllotmentDetail } from '../../../database/schemas';
import { CreateAllotmentDetailDto } from '../dto/create-allotment-detail.dto';
import { AllotmentDetailResponseDto } from '../dto/allotment-detail-response.dto';
import { AllotmentDetailsPaginationQueryDto } from '../dto/allotment-details-pagination.dto';
import {
  ImportAllotmentDetailsResponseDto,
  ImportAllotmentDetailRowDto,
  ImportValidationErrorDto,
} from '../dto/import-allotment-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate as classValidate } from 'class-validator';
import { FileImportUtil } from '../../../common/utils/file-import.util';
import { UpdateAllotmentDetailDto } from '../dto/update-allotment-detail.dto';

@Injectable()
export class AllotmentDetailsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: string,
    createAllotmentDetailDto: CreateAllotmentDetailDto,
  ): Promise<AllotmentDetailResponseDto> {
    const [detail] = await this.db
      .insert(allotmentDetails)
      .values({
        allotment_id: createAllotmentDetailDto.allotment_id,
        office_id: createAllotmentDetailDto.office_id,
        pap_id: createAllotmentDetailDto.pap_id,
        rca_id: createAllotmentDetailDto.rca_id,
        rca_sub_object_id: createAllotmentDetailDto.rca_sub_object_id,
        amount: createAllotmentDetailDto.amount,
        user_id: userId,
      } as NewAllotmentDetail)
      .returning();

    return plainToInstance(AllotmentDetailResponseDto, detail);
  }

  async importFromFile(
    allotmentId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<ImportAllotmentDetailsResponseDto> {
    const parsedData = FileImportUtil.parseExcelFile(file);
    if (!parsedData) {
      throw new BadRequestException('Unable to parse the file or file is empty');
    }

    const { data, headers } = parsedData;

    const requiredColumns = ['office_code', 'pap_code', 'rca_code', 'amount'];

    const columnValidationError = FileImportUtil.validateRequiredColumns(headers, requiredColumns);
    if (columnValidationError) {
      throw new BadRequestException(columnValidationError.message);
    }

    const allotment = await this.db
      .select()
      .from(schema.allotments)
      .where(eq(schema.allotments.id, allotmentId))
      .limit(1);

    if (allotment.length === 0) {
      throw new NotFoundException(`Allotment with ID ${allotmentId} not found`);
    }

    const validationErrors: ImportValidationErrorDto[] = [];
    const parsedRows: Array<{ row: ImportAllotmentDetailRowDto; rowNumber: number; dtoErrors: string[] }> = [];

    for (let i = 0; i < data.length; i++) {
      const rowData = data[i];
      const rowNumber = i + 1;

      try {
        const mappedRow = FileImportUtil.mapRowToDto(rowData, headers, requiredColumns);

        const importRowDto = plainToInstance(ImportAllotmentDetailRowDto, {
          office_code: mappedRow.office_code,
          pap_code: mappedRow.pap_code,
          rca_code: mappedRow.rca_code,
          amount: mappedRow.amount,
        });

        const validationResult = await classValidate(importRowDto);
        const dtoErrors = validationResult.flatMap((error) => Object.values(error.constraints || {}));

        parsedRows.push({ row: importRowDto, rowNumber, dtoErrors });
      } catch {
        validationErrors.push({
          row_number: rowNumber,
          data: {} as ImportAllotmentDetailRowDto,
          errors: ['Failed to process row data'],
        });
      }
    }

    const allOfficeCodes = [...new Set(parsedRows.map((r) => r.row.office_code).filter(Boolean))];
    const allPapCodes = [...new Set(parsedRows.map((r) => r.row.pap_code).filter(Boolean))];
    const allRcaCodes = [...new Set(parsedRows.map((r) => r.row.rca_code).filter(Boolean))];

    type OfficeType = InferSelectModel<typeof schema.fieldOffices>;
    type PapType = InferSelectModel<typeof schema.paps>;
    type RcaType = InferSelectModel<typeof schema.revisedChartOfAccounts>;

    const [offices, papsResult, rcasResult] = await Promise.all([
      allOfficeCodes.length > 0
        ? this.db
            .select()
            .from(schema.fieldOffices)
            .where(and(inArray(schema.fieldOffices.code, allOfficeCodes), eq(schema.fieldOffices.is_active, true)))
        : ([] as OfficeType[]),
      allPapCodes.length > 0
        ? this.db
            .select()
            .from(schema.paps)
            .where(and(inArray(schema.paps.code, allPapCodes), eq(schema.paps.is_active, true)))
        : ([] as PapType[]),
      allRcaCodes.length > 0
        ? this.db
            .select()
            .from(schema.revisedChartOfAccounts)
            .where(
              and(
                inArray(schema.revisedChartOfAccounts.code, allRcaCodes),
                eq(schema.revisedChartOfAccounts.is_active, true),
              ),
            )
        : ([] as RcaType[]),
    ]);

    const officeMap = new Map<string, OfficeType>(offices.map((o) => [o.code, o] as [string, OfficeType]));
    const papMap = new Map<string, PapType>(papsResult.map((p) => [p.code, p] as [string, PapType]));
    const rcaMap = new Map<string, RcaType>(rcasResult.map((r) => [r.code, r] as [string, RcaType]));

    const validRows: Array<{ row: ImportAllotmentDetailRowDto; rowNumber: number }> = [];

    for (const { row, rowNumber, dtoErrors } of parsedRows) {
      const rowErrors: string[] = [...dtoErrors];

      if (row.office_code && !officeMap.has(row.office_code)) {
        rowErrors.push(`Office with code '${row.office_code}' not found or is inactive`);
      }

      if (row.pap_code && !papMap.has(row.pap_code)) {
        rowErrors.push(`PAP with code '${row.pap_code}' not found or is inactive`);
      }

      if (row.rca_code && !rcaMap.has(row.rca_code)) {
        rowErrors.push(`RCA with code '${row.rca_code}' not found or is inactive`);
      }

      if (rowErrors.length > 0) {
        validationErrors.push({
          row_number: rowNumber,
          data: row,
          errors: rowErrors,
        });
      } else {
        validRows.push({ row, rowNumber });
      }
    }

    if (validationErrors.length > 0) {
      return {
        successful_rows: 0,
        failed_rows: validationErrors.length,
        failed_rows_details: validationErrors,
        message: `Validation failed for ${validationErrors.length.toString()} rows. No data was imported.`,
      };
    }

    const importResult = await this.db.transaction(async (tx) => {
      const successfulInserts: NewAllotmentDetail[] = [];

      for (const { row } of validRows) {
        const office = officeMap.get(row.office_code);
        const pap = papMap.get(row.pap_code);
        const rca = rcaMap.get(row.rca_code);

        if (office && pap && rca) {
          successfulInserts.push({
            allotment_id: allotmentId,
            office_id: office.id,
            pap_id: pap.id,
            rca_id: rca.id,
            rca_sub_object_id: null,
            amount: row.amount,
            user_id: userId,
          } as NewAllotmentDetail);
        }
      }

      if (successfulInserts.length > 0) {
        await tx.insert(allotmentDetails).values(successfulInserts);
      }

      return {
        successful_rows: successfulInserts.length,
        failed_rows: 0,
        failed_rows_details: [] as ImportValidationErrorDto[],
        message: `Successfully imported ${successfulInserts.length.toString()} allotment details`,
      };
    });

    return importResult;
  }

  async update(id: string, updateDto: UpdateAllotmentDetailDto): Promise<AllotmentDetailResponseDto> {
    const result = await this.db.update(allotmentDetails).set(updateDto).where(eq(allotmentDetails.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Allotment detail with ID ${id} not found`);
    }

    const detail = result[0];

    return plainToInstance(AllotmentDetailResponseDto, detail);
  }

  async findAll(
    allotmentId: string,
    paginationQuery: AllotmentDetailsPaginationQueryDto,
  ): Promise<{ data: AllotmentDetailResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const offset = (page - 1) * limit;

    const whereCondition = eq(allotmentDetails.allotment_id, allotmentId);

    const detailsWithRelations = await this.db
      .select({
        detail: allotmentDetails,
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
        rcaSubObject: {
          id: schema.rcaSubObjects.id,
          rca_id: schema.rcaSubObjects.rca_id,
          code: schema.rcaSubObjects.code,
          name: schema.rcaSubObjects.name,
          is_active: schema.rcaSubObjects.is_active,
        },
      })
      .from(allotmentDetails)
      .leftJoin(schema.fieldOffices, eq(allotmentDetails.office_id, schema.fieldOffices.id))
      .leftJoin(schema.paps, eq(allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(allotmentDetails.rca_id, schema.revisedChartOfAccounts.id))
      .leftJoin(schema.rcaSubObjects, eq(allotmentDetails.rca_sub_object_id, schema.rcaSubObjects.id))
      .where(whereCondition)
      .limit(limit)
      .offset(offset);

    const [{ value: totalItems }] = await this.db
      .select({ value: count() })
      .from(allotmentDetails)
      .where(whereCondition);

    const data = detailsWithRelations.map((row) => {
      const response = plainToInstance(AllotmentDetailResponseDto, {
        ...row.detail,
        office: row.office,
        pap: row.pap,
        rca: row.rca,
        rca_sub_object: row.rcaSubObject,
      });
      return response;
    });

    return { data, totalItems };
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.delete(allotmentDetails).where(eq(allotmentDetails.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Allotment detail with ID ${id} not found`);
    }
  }
}
