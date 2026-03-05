import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, ilike, or, count, and, isNotNull, inArray, ne } from 'drizzle-orm';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';
import { DATABASE_CONNECTION } from '../../config/database.config';
import * as schema from '../../database/schemas';
import { payees, NewPayee, PayeeType } from '../../database/schemas/payees.schema';
import { employees } from '../../database/schemas/employees.schema';
import { disbursements } from '../../database/schemas/disbursements.schema';
import { collections } from '../../database/schemas/collections.schema';
import { collectionDetails } from '../../database/schemas/collection-details.schema';
import { journalEntries } from '../../database/schemas/journal-entries.schema';
import { paymentDetails } from '../../database/schemas/payment-details.schema';
import { obligations } from '../../database/schemas/obligations.schema';
import { plainToInstance } from 'class-transformer';
import { validate as classValidate } from 'class-validator';
import { PayeeResponseDto } from './dto/payee-response.dto';
import {
  ImportEmployeePayeeRowDto,
  ImportNonEmployeePayeeRowDto,
  ImportPayeesResponseDto,
  ImportPayeeValidationErrorDto,
} from './dto/import-payee.dto';
import { FileImportUtil } from '../../common/utils/file-import.util';
import { S3Service } from '../../common/s3';

@Injectable()
export class PayeesService {
  private readonly logger = new Logger(PayeesService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly s3Service: S3Service,
  ) {}

  async create(userId: string, createPayeeDto: CreatePayeeDto): Promise<PayeeResponseDto> {
    return this.db.transaction(async (tx) => {
      if (createPayeeDto.type === PayeeType.EMPLOYEE) {
        if (!createPayeeDto.employee_id) {
          throw new UnprocessableEntityException(`Employee ID is required for payee type ${PayeeType.EMPLOYEE}`);
        }

        const existingEmployee = await tx.select().from(employees).where(eq(employees.id, createPayeeDto.employee_id));

        if (existingEmployee.length === 0) {
          throw new UnprocessableEntityException(`Employee with ID ${createPayeeDto.employee_id} not found`);
        }
      } else {
        if (!createPayeeDto.name) {
          throw new UnprocessableEntityException(`Name is required for payee type ${createPayeeDto.type}`);
        }
      }

      if (createPayeeDto.bank_account_no) {
        const existingBankAccount = await tx
          .select()
          .from(payees)
          .where(eq(payees.bank_account_no, createPayeeDto.bank_account_no));

        if (existingBankAccount.length > 0) {
          throw new ConflictException(`Bank account number ${createPayeeDto.bank_account_no} is already in use`);
        }
      }

      if (createPayeeDto.tin_no) {
        const existingTin = await tx.select().from(payees).where(eq(payees.tin_no, createPayeeDto.tin_no));

        if (existingTin.length > 0) {
          throw new ConflictException(`TIN number ${createPayeeDto.tin_no} is already in use`);
        }
      }

      const [payee] = await tx
        .insert(payees)
        .values({
          user_id: userId,
          employee_id: createPayeeDto.employee_id ?? null,
          type: createPayeeDto.type,
          name: createPayeeDto.name ?? null,
          tin_no: createPayeeDto.tin_no ?? null,
          bank_account_no: createPayeeDto.bank_account_no ?? null,
        } as NewPayee)
        .returning();

      return plainToInstance(PayeeResponseDto, payee);
    });
  }

  async update(id: string, updatePayeeDto: UpdatePayeeDto): Promise<PayeeResponseDto> {
    return this.db.transaction(async (tx) => {
      const existingPayee = await tx.select().from(payees).where(eq(payees.id, id));

      if (existingPayee.length === 0) {
        throw new NotFoundException(`Payee with ID ${id} not found`);
      }

      if (updatePayeeDto.bank_account_no) {
        const existingBankAccount = await tx
          .select()
          .from(payees)
          .where(and(eq(payees.bank_account_no, updatePayeeDto.bank_account_no), ne(payees.id, id)));

        if (existingBankAccount.length > 0) {
          throw new ConflictException(`Bank account number ${updatePayeeDto.bank_account_no} is already in use`);
        }
      }

      if (updatePayeeDto.tin_no) {
        const existingTin = await tx
          .select()
          .from(payees)
          .where(and(eq(payees.tin_no, updatePayeeDto.tin_no), ne(payees.id, id)));

        if (existingTin.length > 0) {
          throw new ConflictException(`TIN number ${updatePayeeDto.tin_no} is already in use`);
        }
      }

      const [payee] = await tx.update(payees).set(updatePayeeDto).where(eq(payees.id, id)).returning();

      return plainToInstance(PayeeResponseDto, payee);
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    type?: PayeeType,
    tin_no?: string,
    bank_account_no?: string,
  ): Promise<{ data: PayeeResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const searchConditions = search
      ? (() => {
          const searchUpper = search.toUpperCase();
          const typeMatch = Object.values(PayeeType).includes(searchUpper as PayeeType)
            ? eq(payees.type, searchUpper as PayeeType)
            : undefined;

          return or(
            and(isNotNull(payees.name), ilike(payees.name, `%${search}%`)),
            and(isNotNull(payees.tin_no), ilike(payees.tin_no, `%${search}%`)),
            and(isNotNull(payees.bank_account_no), ilike(payees.bank_account_no, `%${search}%`)),
            typeMatch,
          );
        })()
      : undefined;

    const filterConditions = and(
      type ? eq(payees.type, type) : undefined,
      tin_no ? ilike(payees.tin_no, `%${tin_no}%`) : undefined,
      bank_account_no ? ilike(payees.bank_account_no, `%${bank_account_no}%`) : undefined,
    );

    const whereConditions = and(searchConditions, filterConditions);

    const [payeesList, [{ value: totalItems }]] = await Promise.all([
      this.db.select().from(payees).where(whereConditions).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(payees).where(whereConditions),
    ]);

    const enrichedList = await this.resolveEmployeeNamesForPayees(payeesList);
    return {
      data: plainToInstance(PayeeResponseDto, enrichedList),
      totalItems,
    };
  }

  async findOne(id: string): Promise<PayeeResponseDto> {
    const result = await this.db.select().from(payees).where(eq(payees.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Payee with ID ${id} not found`);
    }

    const [enriched] = await this.resolveEmployeeNamesForPayees(result);
    return plainToInstance(PayeeResponseDto, enriched);
  }

  /**
   * For payees of type EMPLOYEE with missing name, resolve name from the employees table.
   */
  private async resolveEmployeeNamesForPayees<
    T extends { employee_id?: string | null; name?: string | null; type: string },
  >(items: T[]): Promise<T[]> {
    const idsToResolve = [
      ...new Set(
        items
          .filter((p) => p.type === 'EMPLOYEE' && (p.name == null || p.name.trim() === '') && p.employee_id != null)
          .map((p) => p.employee_id as string),
      ),
    ];
    if (idsToResolve.length === 0) return items;
    const found = await this.db.select().from(employees).where(inArray(employees.id, idsToResolve));
    const nameByEmployeeId = new Map(
      found.map((e) => {
        const fullName = [e.first_name, e.middle_name, e.last_name, e.extension_name].filter(Boolean).join(' ').trim();
        return [e.id, fullName];
      }),
    );
    return items.map((p) => {
      if (p.type !== 'EMPLOYEE' || p.employee_id == null) return p;
      const resolved = nameByEmployeeId.get(p.employee_id);
      if (resolved == null) return p;
      return { ...p, name: resolved };
    });
  }

  async remove(id: string): Promise<PayeeResponseDto> {
    const existingResult = await this.db.select().from(payees).where(eq(payees.id, id));

    if (existingResult.length === 0) {
      throw new NotFoundException(
        `Payee with ID ${id} not found. It may have been deleted already or the ID is invalid.`,
      );
    }

    const [
      disbursementCount,
      collectionCount,
      collectionDetailCount,
      journalEntryCount,
      paymentDetailCount,
      obligationCount,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(disbursements).where(eq(disbursements.payee_id, id)),
      this.db.select({ count: count() }).from(collections).where(eq(collections.payor_id, id)),
      this.db.select({ count: count() }).from(collectionDetails).where(eq(collectionDetails.payee_id, id)),
      this.db.select({ count: count() }).from(journalEntries).where(eq(journalEntries.payee_id, id)),
      this.db.select({ count: count() }).from(paymentDetails).where(eq(paymentDetails.payee_id, id)),
      this.db.select({ count: count() }).from(obligations).where(eq(obligations.payee_id, id)),
    ]);

    const refs: string[] = [];
    const d = disbursementCount[0]?.count ?? 0;
    const c = collectionCount[0]?.count ?? 0;
    const cd = collectionDetailCount[0]?.count ?? 0;
    const j = journalEntryCount[0]?.count ?? 0;
    const p = paymentDetailCount[0]?.count ?? 0;
    const o = obligationCount[0]?.count ?? 0;
    if (d > 0) refs.push(`${String(d)} disbursement(s)`);
    if (c > 0) refs.push(`${String(c)} collection(s)`);
    if (cd > 0) refs.push(`${String(cd)} collection detail(s)`);
    if (j > 0) refs.push(`${String(j)} journal entry(ies)`);
    if (p > 0) refs.push(`${String(p)} payment detail(s)`);
    if (o > 0) refs.push(`${String(o)} obligation(s)`);

    if (refs.length > 0) {
      throw new ConflictException(`Payee cannot be deleted because it is in use: ${refs.join(', ')}.`);
    }

    const [deleted] = await this.db.delete(payees).where(eq(payees.id, id)).returning();
    return plainToInstance(PayeeResponseDto, deleted);
  }

  async importEmployeesFromFile(userId: string, file: Express.Multer.File): Promise<ImportPayeesResponseDto> {
    try {
      const uploadKey = this.s3Service.generateImportKey(file.originalname);
      await this.s3Service.upload(file, uploadKey);
    } catch (err) {
      this.logger.warn(`S3 upload skipped for employee import: ${err instanceof Error ? err.message : String(err)}`);
    }

    const parsedData = FileImportUtil.parseExcelFile(file);
    if (!parsedData) {
      throw new BadRequestException('Unable to parse the file or file is empty');
    }

    const { data, headers } = parsedData;

    const requiredColumns = ['employee_number'];
    const columnError = FileImportUtil.validateRequiredColumns(headers, requiredColumns);
    if (columnError) {
      throw new BadRequestException(columnError.message);
    }

    const optionalColumns = ['tin_no', 'bank_account_no'];
    const allColumns = [...requiredColumns, ...optionalColumns];

    const validationErrors: ImportPayeeValidationErrorDto[] = [];
    const parsedRows: Array<{ row: ImportEmployeePayeeRowDto; rowNumber: number; dtoErrors: string[] }> = [];

    for (let i = 0; i < data.length; i++) {
      const rowData = data[i];
      const rowNumber = i + 1;

      try {
        const mapped = FileImportUtil.mapRowToDto(rowData, headers, allColumns);

        const rowDto = plainToInstance(ImportEmployeePayeeRowDto, {
          employee_number: mapped.employee_number,
          tin_no: mapped.tin_no || undefined,
          bank_account_no: mapped.bank_account_no || undefined,
        });

        const dtoErrors = (await classValidate(rowDto)).flatMap((e) => Object.values(e.constraints || {}));
        parsedRows.push({ row: rowDto, rowNumber, dtoErrors });
      } catch {
        validationErrors.push({
          row_number: rowNumber,
          data: {} as ImportEmployeePayeeRowDto,
          errors: ['Failed to process row data'],
        });
      }
    }

    const allEmployeeNumbers = [...new Set(parsedRows.map((r) => r.row.employee_number).filter(Boolean))];

    const foundEmployees =
      allEmployeeNumbers.length > 0
        ? await this.db
            .select()
            .from(employees)
            .where(and(inArray(employees.employee_number, allEmployeeNumbers), eq(employees.is_active, true)))
        : [];

    const employeeMap = new Map(foundEmployees.map((e) => [e.employee_number, e]));

    const validRows: Array<{ row: ImportEmployeePayeeRowDto; rowNumber: number }> = [];

    for (const { row, rowNumber, dtoErrors } of parsedRows) {
      const rowErrors: string[] = [...dtoErrors];

      if (row.employee_number && !employeeMap.has(row.employee_number)) {
        rowErrors.push(`Employee with number '${row.employee_number}' not found or is inactive`);
      }

      if (rowErrors.length > 0) {
        validationErrors.push({ row_number: rowNumber, data: row, errors: rowErrors });
      } else {
        validRows.push({ row, rowNumber });
      }
    }

    const allTinNos = validRows.map((r) => r.row.tin_no).filter(Boolean);
    const allBankAccountNos = validRows.map((r) => r.row.bank_account_no).filter(Boolean);

    const existingPayeesWithTin =
      allTinNos.length > 0
        ? await this.db
            .select({ tin_no: payees.tin_no, bank_account_no: payees.bank_account_no })
            .from(payees)
            .where(isNotNull(payees.tin_no))
        : [];
    const existingPayeesWithBank =
      allBankAccountNos.length > 0
        ? await this.db
            .select({ tin_no: payees.tin_no, bank_account_no: payees.bank_account_no })
            .from(payees)
            .where(isNotNull(payees.bank_account_no))
        : [];

    const existingTinSet = new Set(existingPayeesWithTin.map((p) => p.tin_no));
    const existingBankAccountSet = new Set(existingPayeesWithBank.map((p) => p.bank_account_no));

    const duplicateTinInFile = new Set<string>();
    const duplicateBankInFile = new Set<string>();

    const validRowsWithDuplicateCheck: Array<{ row: ImportEmployeePayeeRowDto; rowNumber: number; errors: string[] }> =
      [];

    for (const { row, rowNumber } of validRows) {
      const rowErrors: string[] = [];

      if (row.tin_no && (existingTinSet.has(row.tin_no) || duplicateTinInFile.has(row.tin_no))) {
        rowErrors.push(`TIN number '${row.tin_no}' is already in use`);
        duplicateTinInFile.add(row.tin_no);
      }
      if (
        row.bank_account_no &&
        (existingBankAccountSet.has(row.bank_account_no) || duplicateBankInFile.has(row.bank_account_no))
      ) {
        rowErrors.push(`Bank account number '${row.bank_account_no}' is already in use`);
        duplicateBankInFile.add(row.bank_account_no);
      }

      if (rowErrors.length > 0) {
        validationErrors.push({ row_number: rowNumber, data: row, errors: rowErrors });
      } else {
        if (row.tin_no) duplicateTinInFile.add(row.tin_no);
        if (row.bank_account_no) duplicateBankInFile.add(row.bank_account_no);
        validRowsWithDuplicateCheck.push({ row, rowNumber, errors: [] });
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
      const inserts: NewPayee[] = validRowsWithDuplicateCheck
        .map(({ row }) => {
          const employee = employeeMap.get(row.employee_number);
          if (!employee) return null;
          const fullName = [employee.first_name, employee.middle_name, employee.last_name, employee.extension_name]
            .filter(Boolean)
            .join(' ')
            .trim();
          return {
            user_id: userId,
            type: PayeeType.EMPLOYEE,
            employee_id: employee.id,
            name: fullName || null,
            tin_no: row.tin_no ?? null,
            bank_account_no: row.bank_account_no ?? null,
          } as NewPayee;
        })
        .filter((r): r is NewPayee => r !== null);

      if (inserts.length > 0) {
        await tx.insert(payees).values(inserts);
      }

      return {
        successful_rows: inserts.length,
        failed_rows: 0,
        failed_rows_details: [],
        message: `Successfully imported ${inserts.length.toString()} employee payees`,
      };
    });

    return importResult;
  }

  async importNonEmployeesFromFile(userId: string, file: Express.Multer.File): Promise<ImportPayeesResponseDto> {
    try {
      const uploadKey = this.s3Service.generateImportKey(file.originalname);
      await this.s3Service.upload(file, uploadKey);
    } catch (err) {
      this.logger.warn(
        `S3 upload skipped for non-employee import: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const parsedData = FileImportUtil.parseExcelFile(file);
    if (!parsedData) {
      throw new BadRequestException('Unable to parse the file or file is empty');
    }

    const { data, headers } = parsedData;

    const requiredColumns = ['type', 'name'];
    const columnError = FileImportUtil.validateRequiredColumns(headers, requiredColumns);
    if (columnError) {
      throw new BadRequestException(columnError.message);
    }

    const allColumns = [...requiredColumns, 'tin_no', 'bank_account_no'];

    const validationErrors: ImportPayeeValidationErrorDto[] = [];
    const parsedRows: Array<{ row: ImportNonEmployeePayeeRowDto; rowNumber: number; dtoErrors: string[] }> = [];

    for (let i = 0; i < data.length; i++) {
      const rowData = data[i];
      const rowNumber = i + 1;

      try {
        const mapped = FileImportUtil.mapRowToDto(rowData, headers, allColumns);

        const rowDto = plainToInstance(ImportNonEmployeePayeeRowDto, {
          type: mapped.type.toUpperCase(),
          name: mapped.name,
          tin_no: mapped.tin_no || undefined,
          bank_account_no: mapped.bank_account_no || undefined,
        });

        const dtoErrors = (await classValidate(rowDto)).flatMap((e) => Object.values(e.constraints || {}));
        parsedRows.push({ row: rowDto, rowNumber, dtoErrors });
      } catch {
        validationErrors.push({
          row_number: rowNumber,
          data: {} as ImportNonEmployeePayeeRowDto,
          errors: ['Failed to process row data'],
        });
      }
    }

    const validRows: Array<{ row: ImportNonEmployeePayeeRowDto; rowNumber: number }> = [];

    for (const { row, rowNumber, dtoErrors } of parsedRows) {
      if (dtoErrors.length > 0) {
        validationErrors.push({ row_number: rowNumber, data: row, errors: dtoErrors });
      } else {
        validRows.push({ row, rowNumber });
      }
    }

    const allTinNos = validRows.map((r) => r.row.tin_no).filter(Boolean);
    const allBankAccountNos = validRows.map((r) => r.row.bank_account_no).filter(Boolean);

    const existingPayeesWithTin =
      allTinNos.length > 0
        ? await this.db
            .select({ tin_no: payees.tin_no, bank_account_no: payees.bank_account_no })
            .from(payees)
            .where(isNotNull(payees.tin_no))
        : [];
    const existingPayeesWithBank =
      allBankAccountNos.length > 0
        ? await this.db
            .select({ tin_no: payees.tin_no, bank_account_no: payees.bank_account_no })
            .from(payees)
            .where(isNotNull(payees.bank_account_no))
        : [];

    const existingTinSet = new Set(existingPayeesWithTin.map((p) => p.tin_no));
    const existingBankAccountSet = new Set(existingPayeesWithBank.map((p) => p.bank_account_no));

    const duplicateTinInFile = new Set<string>();
    const duplicateBankInFile = new Set<string>();

    const validRowsWithDuplicateCheck: Array<{
      row: ImportNonEmployeePayeeRowDto;
      rowNumber: number;
      errors: string[];
    }> = [];

    for (const { row, rowNumber } of validRows) {
      const rowErrors: string[] = [];

      if (row.tin_no && (existingTinSet.has(row.tin_no) || duplicateTinInFile.has(row.tin_no))) {
        rowErrors.push(`TIN number '${row.tin_no}' is already in use`);
        duplicateTinInFile.add(row.tin_no);
      }
      if (
        row.bank_account_no &&
        (existingBankAccountSet.has(row.bank_account_no) || duplicateBankInFile.has(row.bank_account_no))
      ) {
        rowErrors.push(`Bank account number '${row.bank_account_no}' is already in use`);
        duplicateBankInFile.add(row.bank_account_no);
      }

      if (rowErrors.length > 0) {
        validationErrors.push({ row_number: rowNumber, data: row, errors: rowErrors });
      } else {
        if (row.tin_no) duplicateTinInFile.add(row.tin_no);
        if (row.bank_account_no) duplicateBankInFile.add(row.bank_account_no);
        validRowsWithDuplicateCheck.push({ row, rowNumber, errors: [] });
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
      const inserts: NewPayee[] = validRowsWithDuplicateCheck.map(({ row }) => ({
        user_id: userId,
        type: row.type,
        employee_id: null,
        name: row.name,
        tin_no: row.tin_no ?? null,
        bank_account_no: row.bank_account_no ?? null,
      }));

      if (inserts.length > 0) {
        await tx.insert(payees).values(inserts);
      }

      return {
        successful_rows: inserts.length,
        failed_rows: 0,
        failed_rows_details: [],
        message: `Successfully imported ${inserts.length.toString()} payees`,
      };
    });

    return importResult;
  }
}
