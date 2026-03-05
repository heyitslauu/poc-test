import * as schema from '../../database/schemas';
import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PinoLogger } from 'pino-nestjs';
import { DATABASE_CONNECTION } from '../../config/database.config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, or, ilike, count } from 'drizzle-orm';
import { ErrorDetail } from '../../common/types/api-response.types';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { FileImportUtil } from '../../common/utils/file-import.util';

import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { ImportOfficeDto } from './dto/import-office.dto';

@Injectable()
export class OfficesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {}

  private async officeExistsByCode(code: string): Promise<boolean> {
    const [office] = await this.db
      .select()
      .from(schema.fieldOffices)
      .where(eq(schema.fieldOffices.code, code))
      .limit(1);

    return !!office;
  }

  async create(createOfficeDto: CreateOfficeDto): Promise<typeof schema.fieldOffices.$inferSelect> {
    this.logger.info('Creating new office', { office: createOfficeDto });

    const exists = await this.officeExistsByCode(createOfficeDto.code);

    if (exists) {
      throw new ConflictException(`Office with code '${createOfficeDto.code}' already exists`);
    }

    const [newOffice] = await this.db.insert(schema.fieldOffices).values(createOfficeDto).returning();

    this.logger.info('Office created successfully', { officeId: newOffice.id });

    return newOffice;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: (typeof schema.fieldOffices.$inferSelect)[]; totalItems: number }> {
    this.logger.info('Retrieving office list', { page, limit, search });

    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(ilike(schema.fieldOffices.code, `%${search}%`), ilike(schema.fieldOffices.name, `%${search}%`))
      : undefined;

    const offices = await this.db.select().from(schema.fieldOffices).where(whereClause).limit(limit).offset(offset);

    const [{ value: totalItems }] = await this.db
      .select({ value: count() })
      .from(schema.fieldOffices)
      .where(whereClause);

    this.logger.info('Office list retrieved successfully', {
      count: offices.length,
      totalItems,
      page,
    });

    return { data: offices, totalItems };
  }

  async findOne(id: string): Promise<typeof schema.fieldOffices.$inferSelect> {
    this.logger.info('Retrieving office by ID', { id });

    const result = await this.db.select().from(schema.fieldOffices).where(eq(schema.fieldOffices.id, id)).limit(1);

    if (result.length === 0) {
      this.logger.warn('Office not found', { id });
      throw new NotFoundException(`Office with ID ${id} not found`);
    }

    const office = result[0];

    this.logger.info('Office retrieved successfully', { officeId: office.id });

    return office;
  }

  async update(id: string, updateOfficeDto: UpdateOfficeDto): Promise<typeof schema.fieldOffices.$inferSelect> {
    this.logger.info('Updating office', { id, updates: updateOfficeDto });

    const result = await this.db.select().from(schema.fieldOffices).where(eq(schema.fieldOffices.id, id)).limit(1);

    if (result.length === 0) {
      this.logger.warn('Office not found', { id });
      throw new NotFoundException(`Office with ID ${id} not found`);
    }

    const office = result[0];

    if (updateOfficeDto.code && updateOfficeDto.code !== office.code) {
      const existingResult = await this.db
        .select()
        .from(schema.fieldOffices)
        .where(eq(schema.fieldOffices.code, updateOfficeDto.code))
        .limit(1);

      if (existingResult.length > 0) {
        throw new ConflictException(`Office with code '${updateOfficeDto.code}' already exists`);
      }
    }

    const [updatedOffice] = await this.db
      .update(schema.fieldOffices)
      .set(updateOfficeDto)
      .where(eq(schema.fieldOffices.id, id))
      .returning();

    this.logger.info('Office updated successfully', { officeId: updatedOffice.id });

    return updatedOffice;
  }

  async remove(id: string): Promise<typeof schema.fieldOffices.$inferSelect> {
    this.logger.info('Deactivating office', { id });

    const result = await this.db.select().from(schema.fieldOffices).where(eq(schema.fieldOffices.id, id)).limit(1);

    if (result.length === 0) {
      this.logger.warn('Office not found', { id });
      throw new NotFoundException(`Office with ID ${id} not found`);
    }

    const office = result[0];

    if (!office.is_active) {
      this.logger.warn('Office already deactivated', { id });
      throw new ConflictException('Office is already deactivated');
    }

    const [deactivatedOffice] = await this.db
      .update(schema.fieldOffices)
      .set({ is_active: false })
      .where(eq(schema.fieldOffices.id, id))
      .returning();

    this.logger.info('Office deactivated successfully', { officeId: deactivatedOffice.id });

    return deactivatedOffice;
  }

  async import(
    file: Express.Multer.File,
  ): Promise<{ successful: ImportOfficeDto[]; failed: { office: ImportOfficeDto; reason: string }[] }> {
    const REQUIRED_COLUMNS = ['name', 'code'];

    const fileValidationError = FileImportUtil.validateFile(file);
    if (fileValidationError) {
      this.logger.warn('File validation failed', { filename: file.originalname });
      throw new BadRequestException(fileValidationError.message);
    }

    this.logger.info('Processing file import', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    const parsedData = FileImportUtil.parseExcelFile(file);
    if (!parsedData) {
      throw new BadRequestException('The uploaded file is empty or has invalid format');
    }

    const { data, headers: normalizedHeaderMap } = parsedData;

    const columnValidationError = FileImportUtil.validateRequiredColumns(normalizedHeaderMap, REQUIRED_COLUMNS);
    if (columnValidationError) {
      throw new BadRequestException(columnValidationError.message);
    }

    const officesToImport = data.map((row) => FileImportUtil.mapRowToDto(row, normalizedHeaderMap, REQUIRED_COLUMNS));

    const errors: { row: number; errors: ValidationError[] }[] = [];
    const validOffices: ImportOfficeDto[] = [];

    for (let i = 0; i < officesToImport.length; i++) {
      const dtoInstance = plainToInstance(ImportOfficeDto, officesToImport[i]);
      const validationErrors = await validate(dtoInstance);

      if (validationErrors.length > 0) {
        errors.push({ row: i + 2, errors: validationErrors });
      } else {
        validOffices.push(dtoInstance);
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

      this.logger.warn('Validation failed for some rows', {
        totalErrors: errors.length,
        errorCount: errorDetails.length,
      });

      throw new UnprocessableEntityException({ message: 'Validation failed', errors: errorDetails });
    }

    const results: {
      successful: ImportOfficeDto[];
      failed: { office: ImportOfficeDto; reason: string }[];
    } = {
      successful: [],
      failed: [],
    };

    for (const office of validOffices) {
      try {
        const newOffice = await this.create(office);
        results.successful.push(newOffice);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ office, reason: errorMessage });
      }
    }

    if (results.failed.length > 0) {
      this.logger.warn('Some offices failed to import', {
        successful: results.successful.length,
        failed: results.failed.length,
      });

      if (results.successful.length === 0) {
        throw new BadRequestException('All offices failed to import');
      }
    }

    this.logger.info('Offices imported', {
      successful: results.successful.length,
      failed: results.failed.length,
    });

    return results;
  }
}
