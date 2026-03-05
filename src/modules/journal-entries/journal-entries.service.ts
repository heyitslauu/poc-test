import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateJournalEntriesBatchDto, CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { DATABASE_CONNECTION } from '../../config/database.config';
import * as schema from '../../database/schemas';
import { journalEntries, NewJournalEntry, JournalEntryType } from '../../database/schemas/journal-entries.schema';
import { FileImportUtil } from '../../common/utils/file-import.util';
import { ImportJournalEntryDto } from './dto/import-journal-entry.dto';
import { validate, ValidationError } from 'class-validator';
import { ErrorDetail } from '../../common/types/api-response.types';
import { S3Service } from '@/common/s3';
import { file_imports } from '@/database/schemas/file_imports.schema';
@Injectable()
export class JournalEntriesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly s3Service: S3Service,
  ) {}

  async create(userId: string, createJournalEntriesBatchDto: CreateJournalEntriesBatchDto) {
    this.validateBalancedEntries(createJournalEntriesBatchDto.entries);

    const result = await this.db.transaction(async (tx) => {
      const createdEntryIds: string[] = [];

      for (const entryDto of createJournalEntriesBatchDto.entries) {
        const newEntry: NewJournalEntry = {
          user_id: userId,
          payee_id: entryDto.payee_id,
          disbursement_id: entryDto.disbursement_id,
          obligation_detail_id: entryDto.obligation_detail_id,
          rca_id: entryDto.rca_id,
          rca_sub_object_id: entryDto.rca_sub_object_id ?? null,
          entry_type: entryDto.entry_type,
          amount: entryDto.amount * 100,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const [journalEntry] = await tx.insert(journalEntries).values(newEntry).returning();

        createdEntryIds.push(journalEntry.id);
      }

      return createdEntryIds;
    });

    const entriesWithDetails = await this.getEntriesWithDetailsByIds(result);

    return plainToInstance(JournalEntryResponseDto, entriesWithDetails);
  }

  private validateBalancedEntries(entries: CreateJournalEntryDto[]): void {
    if (entries.length < 2) {
      throw new BadRequestException('At least 2 journal entries are required for double-entry bookkeeping');
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if (entry.entry_type === JournalEntryType.DEBIT) {
        totalDebits += entry.amount;
      } else {
        totalCredits += entry.amount;
      }
    }

    if (totalDebits !== totalCredits) {
      throw new BadRequestException(
        `Journal entries are not balanced. Total debits (${(totalDebits / 100).toFixed(2)}) must equal total credits (${(totalCredits / 100).toFixed(2)})`,
      );
    }
  }

  private validateBalancedImportEntries(entries: ImportJournalEntryDto[]): void {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      totalDebits += entry.debit || 0;
      totalCredits += entry.credit || 0;
    }

    if (totalDebits !== totalCredits) {
      throw new BadRequestException(
        `Journal entries are not balanced. Total debits (${totalDebits.toFixed(2)}) must equal total credits (${totalCredits.toFixed(2)})`,
      );
    }
  }

  private async getEntriesWithDetailsByIds(entryIds: string[]): Promise<JournalEntryResponseDto[]> {
    if (entryIds.length === 0) {
      return [];
    }

    const entries = await this.db
      .select({
        id: journalEntries.id,
        user_id: journalEntries.user_id,
        payee_id: journalEntries.payee_id,
        payee: {
          id: schema.payees.id,
          user_id: schema.payees.user_id,
          employee_id: schema.payees.employee_id,
          type: schema.payees.type,
          name: schema.payees.name,
          tin_no: schema.payees.tin_no,
          bank_account_no: schema.payees.bank_account_no,
        },
        disbursement_id: journalEntries.disbursement_id,
        obligation_detail_id: journalEntries.obligation_detail_id,
        rca_id: journalEntries.rca_id,
        rca: {
          id: schema.revisedChartOfAccounts.id,
          code: schema.revisedChartOfAccounts.code,
          name: schema.revisedChartOfAccounts.name,
          is_active: schema.revisedChartOfAccounts.is_active,
          allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
        },
        rca_sub_object_id: journalEntries.rca_sub_object_id,
        rca_sub_object: {
          id: schema.rcaSubObjects.id,
          rca_id: schema.rcaSubObjects.rca_id,
          code: schema.rcaSubObjects.code,
          name: schema.rcaSubObjects.name,
          is_active: schema.rcaSubObjects.is_active,
          created_at: schema.rcaSubObjects.created_at,
          updated_at: schema.rcaSubObjects.updated_at,
        },
        pap: {
          id: schema.paps.id,
          code: schema.paps.code,
          name: schema.paps.name,
          is_active: schema.paps.is_active,
        },
        entry_type: journalEntries.entry_type,
        amount: journalEntries.amount,
        created_at: journalEntries.created_at,
        updated_at: journalEntries.updated_at,
      })
      .from(journalEntries)
      .leftJoin(schema.payees, eq(journalEntries.payee_id, schema.payees.id))
      .leftJoin(schema.obligationDetails, eq(journalEntries.obligation_detail_id, schema.obligationDetails.id))
      .leftJoin(schema.allotmentDetails, eq(schema.obligationDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(journalEntries.rca_id, schema.revisedChartOfAccounts.id))
      .leftJoin(schema.rcaSubObjects, eq(journalEntries.rca_sub_object_id, schema.rcaSubObjects.id))
      .where(inArray(journalEntries.id, entryIds));

    return entries.map((entry) => ({
      ...entry,
      amount: entry.amount / 100,
    })) as JournalEntryResponseDto[];
  }

  async findByDV(disbursementId: string): Promise<JournalEntryResponseDto[]> {
    const entries = await this.db
      .select({
        id: journalEntries.id,
        user_id: journalEntries.user_id,
        payee_id: journalEntries.payee_id,
        payee: {
          id: schema.payees.id,
          user_id: schema.payees.user_id,
          employee_id: schema.payees.employee_id,
          type: schema.payees.type,
          name: schema.payees.name,
          tin_no: schema.payees.tin_no,
          bank_account_no: schema.payees.bank_account_no,
        },
        disbursement_id: journalEntries.disbursement_id,
        obligation_detail_id: journalEntries.obligation_detail_id,
        rca_id: journalEntries.rca_id,
        rca: {
          id: schema.revisedChartOfAccounts.id,
          code: schema.revisedChartOfAccounts.code,
          name: schema.revisedChartOfAccounts.name,
          is_active: schema.revisedChartOfAccounts.is_active,
          allows_sub_object: schema.revisedChartOfAccounts.allows_sub_object,
        },
        rca_sub_object_id: journalEntries.rca_sub_object_id,
        rca_sub_object: {
          id: schema.rcaSubObjects.id,
          rca_id: schema.rcaSubObjects.rca_id,
          code: schema.rcaSubObjects.code,
          name: schema.rcaSubObjects.name,
          is_active: schema.rcaSubObjects.is_active,
          created_at: schema.rcaSubObjects.created_at,
          updated_at: schema.rcaSubObjects.updated_at,
        },
        pap: {
          id: schema.paps.id,
          code: schema.paps.code,
          name: schema.paps.name,
          is_active: schema.paps.is_active,
        },
        entry_type: journalEntries.entry_type,
        amount: journalEntries.amount,
        created_at: journalEntries.created_at,
        updated_at: journalEntries.updated_at,
      })
      .from(journalEntries)
      .leftJoin(schema.payees, eq(journalEntries.payee_id, schema.payees.id))
      .leftJoin(schema.obligationDetails, eq(journalEntries.obligation_detail_id, schema.obligationDetails.id))
      .leftJoin(schema.allotmentDetails, eq(schema.obligationDetails.allotment_details_id, schema.allotmentDetails.id))
      .leftJoin(schema.paps, eq(schema.allotmentDetails.pap_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(journalEntries.rca_id, schema.revisedChartOfAccounts.id))
      .leftJoin(schema.rcaSubObjects, eq(journalEntries.rca_sub_object_id, schema.rcaSubObjects.id))
      .where(eq(journalEntries.disbursement_id, disbursementId));

    return entries.map((entry) => ({
      ...entry,
      amount: entry.amount / 100,
    })) as JournalEntryResponseDto[];
  }

  async remove(id: string): Promise<void> {
    const existingEntry = await this.db.select().from(journalEntries).where(eq(journalEntries.id, id));

    if (existingEntry.length === 0) {
      throw new NotFoundException(`Journal entry with ID ${id} not found`);
    }

    await this.db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async import(userId: string, disbursementId: string, file: Express.Multer.File): Promise<JournalEntryResponseDto[]> {
    const REQUIRED_COLUMNS = ['payee', 'pap', 'object code', 'debit', 'credit'];

    const fileValidationError = FileImportUtil.validateFile(file);
    if (fileValidationError) {
      throw new BadRequestException(fileValidationError.message);
    }

    const parsedData = FileImportUtil.parseExcelFile(file);
    if (!parsedData) {
      throw new BadRequestException('The uploaded file is empty or has invalid format');
    }

    const { data, headers: normalizedHeaderMap } = parsedData;

    const columnValidationError = FileImportUtil.validateRequiredColumns(normalizedHeaderMap, REQUIRED_COLUMNS);
    if (columnValidationError) {
      throw new BadRequestException(columnValidationError.message);
    }

    const journalEntriesToImport = data.map((row) => {
      const mapped = FileImportUtil.mapRowToDto(row, normalizedHeaderMap, [
        'payee',
        'source ors (if applicable)',
        'pap',
        'object code',
        'sub object code (if applicable)',
        'debit',
        'credit',
      ]);

      return {
        payee: mapped['payee'],
        source_ors: mapped['source ors (if applicable)'],
        pap: mapped['pap'],
        object_code: mapped['object code'],
        sub_object_code: mapped['sub object code (if applicable)'],
        debit: parseFloat(mapped['debit']) || 0,
        credit: parseFloat(mapped['credit']) || 0,
      };
    });

    const errors: { row: number; errors: ValidationError[] }[] = [];
    const validEntries: ImportJournalEntryDto[] = [];

    for (let i = 0; i < journalEntriesToImport.length; i++) {
      const dtoInstance = plainToInstance(ImportJournalEntryDto, journalEntriesToImport[i]);
      const validationErrors = await validate(dtoInstance);

      if (validationErrors.length > 0) {
        errors.push({ row: i + 2, errors: validationErrors });
      } else {
        validEntries.push(dtoInstance);
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

    this.validateBalancedImportEntries(validEntries);

    // ============================================================
    // BATCH PRELOAD: Collect unique keys and load reference data
    // ============================================================
    const uniquePayeeNames = new Set<string>();
    const uniqueOrsCodes = new Set<string>();
    const uniqueObjectCodes = new Set<string>();
    const uniqueSubObjectCodes = new Set<string>();

    for (const entry of validEntries) {
      uniquePayeeNames.add(entry.payee.trim());
      if (entry.source_ors?.trim()) {
        uniqueOrsCodes.add(entry.source_ors.trim());
      }
      uniqueObjectCodes.add(entry.object_code.trim());
      if (entry.sub_object_code?.trim()) {
        uniqueSubObjectCodes.add(entry.sub_object_code.trim());
      }
    }

    // Batch load all reference data (one query per table)
    const payeesList =
      uniquePayeeNames.size > 0
        ? await this.db
            .select()
            .from(schema.payees)
            .where(inArray(schema.payees.name, [...uniquePayeeNames]))
        : [];

    const obligationsList =
      uniqueOrsCodes.size > 0
        ? await this.db
            .select()
            .from(schema.obligations)
            .where(inArray(schema.obligations.ors_number, [...uniqueOrsCodes]))
        : [];

    const rcaList =
      uniqueObjectCodes.size > 0
        ? await this.db
            .select()
            .from(schema.revisedChartOfAccounts)
            .where(inArray(schema.revisedChartOfAccounts.code, [...uniqueObjectCodes]))
        : [];

    const rcaSubObjectsList =
      uniqueSubObjectCodes.size > 0
        ? await this.db
            .select()
            .from(schema.rcaSubObjects)
            .where(inArray(schema.rcaSubObjects.code, [...uniqueSubObjectCodes]))
        : [];

    // Build lookup maps (key → record)
    const payeeMap = new Map(payeesList.map((p) => [p.name, p] as const));
    const obligationMap = new Map(obligationsList.map((o) => [o.ors_number, o] as const));
    const rcaMap = new Map(rcaList.map((r) => [r.code, r] as const));
    const rcaSubObjectMap = new Map(rcaSubObjectsList.map((s) => [s.code, s] as const));

    // Load obligation details for all matched obligations (batch)
    const obligationIds = obligationsList.map((o) => o.id);
    const obligationDetailsList =
      obligationIds.length > 0
        ? await this.db
            .select()
            .from(schema.obligationDetails)
            .where(inArray(schema.obligationDetails.obligation_id, obligationIds))
        : [];

    // Map obligation_id → first obligation detail
    const obligationDetailMap = new Map(obligationDetailsList.map((d) => [d.obligation_id, d] as const));

    // ============================================================
    // VALIDATE & BUILD INSERT PAYLOADS
    // ============================================================
    const failed: { entry: ImportJournalEntryDto; reason: string }[] = [];
    const entriesToInsert: NewJournalEntry[] = [];

    for (const entry of validEntries) {
      // Validate at least one amount
      if (!entry.debit && !entry.credit) {
        failed.push({ entry, reason: 'At least one of Debit or Credit must have a value' });
        continue;
      }

      // Resolve payee
      const payeeName = entry.payee.trim();
      const payee = payeeMap.get(payeeName);
      if (!payee) {
        failed.push({ entry, reason: `Payee "${payeeName}" not found` });
        continue;
      }

      // Resolve obligation (optional)
      let obligationDetailId: string | null = null;
      const sourceOrs = entry.source_ors?.trim();
      if (sourceOrs) {
        const obligation = obligationMap.get(sourceOrs);
        if (!obligation) {
          failed.push({ entry, reason: `Obligation with ORS "${sourceOrs}" not found` });
          continue;
        }
        const obligationDetail = obligationDetailMap.get(obligation.id);
        if (!obligationDetail) {
          failed.push({ entry, reason: `Obligation detail not found for ORS "${sourceOrs}"` });
          continue;
        }
        obligationDetailId = obligationDetail.id;
      }

      // Resolve RCA
      const objectCode = entry.object_code.trim();
      const rca = rcaMap.get(objectCode);
      if (!rca) {
        failed.push({ entry, reason: `Object Code "${objectCode}" not found` });
        continue;
      }

      // Resolve RCA sub-object (optional)
      let rcaSubObjectId: string | null = null;
      const subObjectCode = entry.sub_object_code?.trim();
      if (subObjectCode) {
        const rcaSubObject = rcaSubObjectMap.get(subObjectCode);
        if (!rcaSubObject) {
          failed.push({ entry, reason: `Sub Object Code "${subObjectCode}" not found` });
          continue;
        }
        rcaSubObjectId = rcaSubObject.id;
      }

      // Build entry payloads
      const now = new Date();

      if (entry.debit && entry.debit > 0) {
        entriesToInsert.push({
          user_id: userId,
          payee_id: payee.id,
          disbursement_id: disbursementId,
          obligation_detail_id: obligationDetailId,
          rca_id: rca.id,
          rca_sub_object_id: rcaSubObjectId,
          entry_type: JournalEntryType.DEBIT,
          amount: entry.debit * 100,
          created_at: now,
          updated_at: now,
        });
      }

      if (entry.credit && entry.credit > 0) {
        entriesToInsert.push({
          user_id: userId,
          payee_id: payee.id,
          disbursement_id: disbursementId,
          obligation_detail_id: obligationDetailId,
          rca_id: rca.id,
          rca_sub_object_id: rcaSubObjectId,
          entry_type: JournalEntryType.CREDIT,
          amount: entry.credit * 100,
          created_at: now,
          updated_at: now,
        });
      }
    }

    // If any validation failed, throw before inserting
    if (failed.length > 0) {
      throw new BadRequestException({
        message: 'Import failed - validation errors',
        failed,
      });
    }

    // ============================================================
    // BULK INSERT (single transaction, chunked if needed)
    // ============================================================
    const CHUNK_SIZE = 500;
    const insertedIds: string[] = [];

    await this.db.transaction(async (tx) => {
      for (let i = 0; i < entriesToInsert.length; i += CHUNK_SIZE) {
        const chunk = entriesToInsert.slice(i, i + CHUNK_SIZE);
        const inserted = await tx.insert(journalEntries).values(chunk).returning({ id: journalEntries.id });
        insertedIds.push(...inserted.map((r) => r.id));
      }

      const uploadResult = await this.s3Service.upload(file);

      await this.db.insert(file_imports).values({
        imported_by: userId,
        import_file: uploadResult.url,
      });
    });

    // Return entries with full relation details
    return this.getEntriesWithDetailsByIds(insertedIds);
  }
}
