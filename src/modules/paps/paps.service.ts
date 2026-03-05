import * as schema from '../../database/schemas';
import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { DATABASE_CONNECTION } from '../../config/database.config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, or, ilike, count, inArray } from 'drizzle-orm';
import { ErrorDetail } from '../../common/types/api-response.types';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { FileImportUtil } from '../../common/utils/file-import.util';

import { CreatePapDto } from './dto/create-pap.dto';
import { UpdatePapDto } from './dto/update-pap.dto';
import { ImportPapDto } from './dto/import-pap.dto';
import { S3Service } from '@/common/s3';
import { PapResponseDto } from './dto/pap-response.dto';
import { chunkArray } from '@/common/utils/chunk.util';
import { file_imports } from '@/database/schemas/file_imports.schema';
@Injectable()
export class PapsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly logger: PinoLogger,
    private readonly s3Service: S3Service,
  ) {}

  private async papExistsByCode(code: string): Promise<boolean> {
    const [pap] = await this.db.select().from(schema.paps).where(eq(schema.paps.code, code)).limit(1);

    return !!pap;
  }

  async create(createPapDto: CreatePapDto) {
    const exists = await this.papExistsByCode(createPapDto.code);

    if (exists) {
      throw new ConflictException(`PAP with code '${createPapDto.code}' already exists`);
    }

    const [newPap] = await this.db.insert(schema.paps).values(createPapDto).returning();

    return plainToInstance(PapResponseDto, newPap);
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(ilike(schema.paps.code, `%${search}%`), ilike(schema.paps.name, `%${search}%`))
      : undefined;

    const paps = await this.db.select().from(schema.paps).where(whereClause).limit(limit).offset(offset);

    const [{ value: totalItems }] = await this.db.select({ value: count() }).from(schema.paps).where(whereClause);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: plainToInstance(PapResponseDto, paps),
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }

  async findOne(id: string) {
    const result = (await this.db.select().from(schema.paps).where(eq(schema.paps.id, id)).limit(1)).at(0);

    if (!result) throw new NotFoundException(`PAP with ID '${id}' not found`);

    return plainToInstance(PapResponseDto, result);
  }

  async update(id: string, updatePapDto: UpdatePapDto) {
    const result = (await this.db.select().from(schema.paps).where(eq(schema.paps.id, id)).limit(1)).at(0);

    if (!result) throw new NotFoundException(`PAP with ID '${id}' not found`);

    if (updatePapDto.code && updatePapDto.code !== result.code) {
      const conflict = (
        await this.db.select().from(schema.paps).where(eq(schema.paps.code, updatePapDto.code)).limit(1)
      ).at(0);

      if (conflict) {
        throw new ConflictException(`PAP with code '${updatePapDto.code}' already exists`);
      }
    }

    const [updatedPap] = await this.db.transaction(async (tx) =>
      tx.update(schema.paps).set(updatePapDto).where(eq(schema.paps.id, id)).returning(),
    );

    return plainToInstance(PapResponseDto, updatedPap);
  }

  async remove(id: string) {
    const result = (await this.db.select().from(schema.paps).where(eq(schema.paps.id, id)).limit(1)).at(0);

    if (!result) throw new NotFoundException(`PAP with ID '${id}' not found`);

    const [deactivatedPap] = await this.db.transaction(async (tx) =>
      tx.update(schema.paps).set({ is_active: false }).where(eq(schema.paps.id, id)).returning(),
    );

    return plainToInstance(PapResponseDto, deactivatedPap);
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

    const papsToImport = data.map((row) => FileImportUtil.mapRowToDto(row, normalizedHeaderMap, REQUIRED_COLUMNS));

    const errors: { row: number; errors: ValidationError[] }[] = [];
    const validPaps: ImportPapDto[] = [];

    for (let i = 0; i < papsToImport.length; i++) {
      const dtoInstance = plainToInstance(ImportPapDto, papsToImport[i]);
      const validationErrors = await validate(dtoInstance);

      if (validationErrors.length > 0) {
        errors.push({ row: i + 2, errors: validationErrors });
      } else {
        validPaps.push(dtoInstance);
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

    const duplicateCodesInFile = validPaps.map((r) => r.code).filter((code, idx, arr) => arr.indexOf(code) !== idx);

    if (duplicateCodesInFile.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Duplicate codes found in file',
        errors: duplicateCodesInFile.map((code) => ({ field: 'code', value: code, issue: 'Duplicate in file' })),
      });
    }

    // === Check for duplicates in DB ===
    const codes = validPaps.map((r) => r.code);
    const existingPaps = await this.db.select().from(schema.paps).where(inArray(schema.paps.code, codes));

    if (existingPaps.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Some codes already exist in the database',
        errors: existingPaps.map((r) => ({
          field: 'code',
          value: r.code,
          issue: `${r.code} - ${r.name} already exists`,
        })),
      });
    }

    const insertedPaps: PapResponseDto[] = [];

    await this.db.transaction(async (tx) => {
      const chunks = chunkArray(validPaps, 1000);

      for (const chunk of chunks) {
        const rows = await tx
          .insert(schema.paps)
          .values(chunk.map((r) => ({ code: r.code, name: r.name })))
          .returning();

        insertedPaps.push(...rows);
      }
    });

    const uploadResult = await this.s3Service.upload(file);

    await this.db.insert(file_imports).values({
      imported_by: userId,
      import_file: uploadResult.url,
    });

    return plainToInstance(PapResponseDto, insertedPaps);
  }
}
