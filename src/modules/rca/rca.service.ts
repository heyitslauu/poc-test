import * as schema from '../../database/schemas';
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { DATABASE_CONNECTION } from '../../config/database.config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, or, ilike, count, and, inArray, desc } from 'drizzle-orm';
import { ErrorDetail } from '../../common/types/api-response.types';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { FileImportUtil } from '../../common/utils/file-import.util';

import { CreateRcaDto } from './dto/create-rca.dto';
import { UpdateRcaDto } from './dto/update-rca.dto';
import { CreateSubObjectDto } from './dto/create-sub-object.dto';
import { UpdateSubObjectDto } from './dto/update-sub-object.dto';
import { SubObjectResponseDto } from './dto/sub-object-response.dto';
import { ImportRcaDto } from './dto/import-rca.dto';

import { S3Service } from '@/common/s3';
import { chunkArray } from '@/common/utils/chunk.util';
import { RcaResponseDto } from './dto/rca-response.dto';
import { file_imports } from '@/database/schemas/file_imports.schema';
@Injectable()
export class RcaService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly logger: PinoLogger,
    private readonly s3Service: S3Service,
  ) {}

  private async rcaExistsByCode(code: string): Promise<boolean> {
    const [rca] = await this.db
      .select()
      .from(schema.revisedChartOfAccounts)
      .where(eq(schema.revisedChartOfAccounts.code, code))
      .limit(1);

    return !!rca;
  }

  async create(createRcaDto: CreateRcaDto) {
    const exists = await this.rcaExistsByCode(createRcaDto.code);

    if (exists) {
      throw new ConflictException(`RCA with code '${createRcaDto.code}' already exists`);
    }

    const [newRca] = await this.db.insert(schema.revisedChartOfAccounts).values(createRcaDto).returning();

    return plainToInstance(RcaResponseDto, newRca);
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(
          ilike(schema.revisedChartOfAccounts.code, `%${search}%`),
          ilike(schema.revisedChartOfAccounts.name, `%${search}%`),
        )
      : undefined;

    const rcas = await this.db
      .select()
      .from(schema.revisedChartOfAccounts)
      .where(whereClause)
      .limit(limit)
      .orderBy(desc(schema.revisedChartOfAccounts.created_at))
      .offset(offset);

    const [{ value: totalItems }] = await this.db
      .select({ value: count() })
      .from(schema.revisedChartOfAccounts)
      .where(whereClause);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: plainToInstance(RcaResponseDto, rcas),
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  async findOne(id: string) {
    const rca = (
      await this.db
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, id))
        .limit(1)
    ).at(0);

    if (!rca) throw new NotFoundException('Revised Chart of Account/UACS not found.');

    return plainToInstance(RcaResponseDto, rca);
  }

  async update(id: string, updateRcaDto: UpdateRcaDto) {
    const rca = (
      await this.db
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, id))
        .limit(1)
    ).at(0);

    if (!rca) throw new NotFoundException('Revised Chart of Account/UACS not found.');

    if (updateRcaDto.code && updateRcaDto.code !== rca.code) {
      const conflict = (
        await this.db
          .select()
          .from(schema.revisedChartOfAccounts)
          .where(eq(schema.revisedChartOfAccounts.code, updateRcaDto.code))
          .limit(1)
      ).at(0);

      if (conflict) {
        throw new ConflictException(`RCA with code '${updateRcaDto.code}' already exists`);
      }
    }

    const [updatedRca] = await this.db.transaction(async (tx) =>
      tx
        .update(schema.revisedChartOfAccounts)
        .set(updateRcaDto)
        .where(eq(schema.revisedChartOfAccounts.id, id))
        .returning(),
    );

    return plainToInstance(RcaResponseDto, updatedRca);
  }

  async remove(id: string) {
    const rca = (
      await this.db
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, id))
        .limit(1)
    ).at(0);

    if (!rca) throw new NotFoundException('Revised Chart of Account/UACS not found.');

    if (!rca.is_active) {
      this.logger.warn('RCA already deactivated', { id });
      throw new ConflictException('RCA is already deactivated');
    }

    const [deactivatedRca] = await this.db
      .update(schema.revisedChartOfAccounts)
      .set({ is_active: false })
      .where(eq(schema.revisedChartOfAccounts.id, id))
      .returning();

    return plainToInstance(RcaResponseDto, deactivatedRca);
  }

  async import(userId: string, file: Express.Multer.File) {
    const REQUIRED_COLUMNS = ['name', 'code'];

    const fileValidationError = FileImportUtil.validateFile(file);
    if (fileValidationError) {
      this.logger.warn('File validation failed', { filename: file.originalname });
      return fileValidationError;
    }

    const parsedData = FileImportUtil.parseExcelFile(file);
    if (!parsedData) {
      throw new BadRequestException('The uploaded file is empty or has invalid format');
    }

    const { data, headers: normalizedHeaderMap } = parsedData;

    const columnValidationError = FileImportUtil.validateRequiredColumns(normalizedHeaderMap, REQUIRED_COLUMNS);

    if (columnValidationError) {
      throw new UnprocessableEntityException({ message: 'Missing required columns', errors: columnValidationError });
    }

    const rcasToImport = data.map((row) => FileImportUtil.mapRowToDto(row, normalizedHeaderMap, REQUIRED_COLUMNS));

    const errors: { row: number; errors: ValidationError[] }[] = [];
    const validRcas: ImportRcaDto[] = [];

    for (let i = 0; i < rcasToImport.length; i++) {
      const dtoInstance = plainToInstance(ImportRcaDto, rcasToImport[i]);
      const validationErrors = await validate(dtoInstance);

      if (validationErrors.length > 0) {
        errors.push({ row: i + 2, errors: validationErrors });
      } else {
        validRcas.push(dtoInstance);
      }
    }

    if (errors.length > 0) {
      const errorDetails: ErrorDetail[] = [];

      errors.forEach(({ row, errors: validationErrors }) => {
        validationErrors.forEach((err) => {
          Object.values(err.constraints || {}).forEach((message) => {
            errorDetails.push({
              field: err.property,
              value: err.value,
              issue: message,
              location: `Row ${row.toString()}`,
            });
          });
        });
      });

      throw new UnprocessableEntityException({ message: 'Validation failed', errors: errorDetails });
    }

    const duplicateCodesInFile = validRcas.map((r) => r.code).filter((code, idx, arr) => arr.indexOf(code) !== idx);

    if (duplicateCodesInFile.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Duplicate codes found in file',
        errors: duplicateCodesInFile.map((code) => ({ field: 'code', value: code, issue: 'Duplicate in file' })),
      });
    }

    // === Check for duplicates in DB ===
    const codes = validRcas.map((r) => r.code);
    const existingRcas = await this.db
      .select()
      .from(schema.revisedChartOfAccounts)
      .where(inArray(schema.revisedChartOfAccounts.code, codes));

    if (existingRcas.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Some codes already exist in the database',
        errors: existingRcas.map((r) => ({
          field: 'code',
          value: r.code,
          issue: `${r.code} - ${r.name} already exists`,
        })),
      });
    }

    const insertedRcas: RcaResponseDto[] = [];

    await this.db.transaction(async (tx) => {
      const chunks = chunkArray(validRcas, 1000);

      for (const chunk of chunks) {
        const rows = await tx
          .insert(schema.revisedChartOfAccounts)
          .values(chunk.map((r) => ({ code: r.code, name: r.name })))
          .returning();

        insertedRcas.push(...rows);
      }
    });

    const uploadResult = await this.s3Service.upload(file);

    await this.db.insert(file_imports).values({
      imported_by: userId,
      import_file: uploadResult.url,
    });

    return plainToInstance(RcaResponseDto, insertedRcas);
  }

  private async subObjectExistsByCode(rcaId: string, code: string): Promise<boolean> {
    const [subObject] = await this.db
      .select()
      .from(schema.rcaSubObjects)
      .where(and(eq(schema.rcaSubObjects.rca_id, rcaId), eq(schema.rcaSubObjects.code, code)))
      .limit(1);

    return !!subObject;
  }

  async createSubObject(rcaId: string, createSubObjectDto: CreateSubObjectDto) {
    const rca = (
      await this.db
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, rcaId))
        .limit(1)
    ).at(0);

    if (!rca) throw new NotFoundException('Revised Chart of Account/UACS not found.');

    if (!rca.allows_sub_object) {
      throw new BadRequestException('Parent RCA does not allow sub objects');
    }

    const exists = await this.subObjectExistsByCode(rcaId, createSubObjectDto.code);

    if (exists) {
      throw new ConflictException(
        `Sub object with code '${createSubObjectDto.code}'  ${createSubObjectDto.name}already exists for this RCA`,
      );
    }

    const [newSubObject] = await this.db
      .insert(schema.rcaSubObjects)
      .values({
        rca_id: rcaId,
        code: createSubObjectDto.code,
        name: createSubObjectDto.name,
      })
      .returning();

    return plainToInstance(SubObjectResponseDto, newSubObject);
  }

  async findAllSubObjects(rcaId: string, page: number = 1, limit: number = 10, search?: string) {
    const rca = (
      await this.db
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, rcaId))
        .limit(1)
    ).at(0);

    if (!rca) throw new NotFoundException('Revised Chart of Account/UACS not found.');

    const offset = (page - 1) * limit;

    const whereClause = search
      ? and(
          eq(schema.rcaSubObjects.rca_id, rcaId),
          or(ilike(schema.rcaSubObjects.code, `%${search}%`), ilike(schema.rcaSubObjects.name, `%${search}%`)),
        )
      : eq(schema.rcaSubObjects.rca_id, rcaId);

    const subObjects = await this.db.select().from(schema.rcaSubObjects).where(whereClause).limit(limit).offset(offset);

    const [{ value: totalItems }] = await this.db
      .select({ value: count() })
      .from(schema.rcaSubObjects)
      .where(whereClause);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: plainToInstance(SubObjectResponseDto, subObjects),
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  async findOneSubObject(rcaId: string, id: string) {
    const subObject = (
      await this.db
        .select()
        .from(schema.rcaSubObjects)
        .where(and(eq(schema.rcaSubObjects.id, id), eq(schema.rcaSubObjects.rca_id, rcaId)))
        .limit(1)
    ).at(0);

    if (!subObject) {
      throw new NotFoundException('Sub object not found');
    }
    return plainToInstance(SubObjectResponseDto, subObject);
  }

  async updateSubObject(rcaId: string, id: string, updateSubObjectDto: UpdateSubObjectDto) {
    const subObject = (
      await this.db
        .select()
        .from(schema.rcaSubObjects)
        .where(and(eq(schema.rcaSubObjects.id, id), eq(schema.rcaSubObjects.rca_id, rcaId)))
        .limit(1)
    ).at(0);

    if (!subObject) {
      throw new NotFoundException('Sub object not found');
    }

    if (updateSubObjectDto.code && updateSubObjectDto.code !== subObject.code) {
      const exists = await this.subObjectExistsByCode(rcaId, updateSubObjectDto.code);

      if (exists) {
        throw new ConflictException(`Sub object with code '${updateSubObjectDto.code}' already exists for this RCA`);
      }
    }

    const [updatedSubObject] = await this.db.transaction(async (tx) =>
      tx.update(schema.rcaSubObjects).set(updateSubObjectDto).where(eq(schema.rcaSubObjects.id, id)).returning(),
    );

    return plainToInstance(SubObjectResponseDto, updatedSubObject);
  }

  async removeSubObject(rcaId: string, id: string) {
    const subObject = (
      await this.db
        .select()
        .from(schema.rcaSubObjects)
        .where(and(eq(schema.rcaSubObjects.id, id), eq(schema.rcaSubObjects.rca_id, rcaId)))
        .limit(1)
    ).at(0);

    if (!subObject) {
      throw new NotFoundException('Sub object not found');
    }

    const [deactivatedSubObject] = await this.db
      .update(schema.rcaSubObjects)
      .set({ is_active: false })
      .where(eq(schema.rcaSubObjects.id, id))
      .returning();

    return plainToInstance(SubObjectResponseDto, deactivatedSubObject);
  }
}
