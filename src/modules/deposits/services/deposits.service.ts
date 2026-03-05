import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, asc, ilike, SQL, inArray, sql } from 'drizzle-orm';
import { CreateDepositDto } from '../dto/create-deposit.dto';
import { UpdateDepositDto } from '../dto/update-deposit.dto';
import { DepositResponseDto } from '../dto/deposit-response.dto';
import { DepositsPaginationQueryDto } from '../dto/deposits-pagination.dto';
import { CreateDepositCollectionDto } from '../dto/create-deposit-collection.dto';
import { DepositCollectionResponseDto } from '../dto/deposit-collection-response.dto';
import { CreateDepositJournalEntryDto } from '../dto/create-deposit-journal-entry.dto';
import { DepositJournalEntryResponseDto } from '../dto/deposit-journal-entry-response.dto';
import { DepositCollectionItemDto } from '../dto/deposit-collection-item.dto';
import { DATABASE_CONNECTION } from '@/config/database.config';
import * as schema from '@/database/schemas';
import { deposits, NewDeposit, DepositStatus } from '@/database/schemas/deposits.schema';
import { depositCollections, NewDepositCollection } from '@/database/schemas/deposit-collections.schema';
import { depositJournalEntries, NewDepositJournalEntry } from '@/database/schemas/deposit-journal-entries.schema';
import type { FundCluster } from '@/database/schemas/allotments.schema';
import type { BankAccountType } from '@/database/schemas/payments.schema';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DepositsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: string, createDepositDto: CreateDepositDto): Promise<DepositResponseDto> {
    return await this.db.transaction(async (tx) => {
      const [deposit] = await tx
        .insert(deposits)
        .values({
          user_id: userId,
          fund_cluster: createDepositDto.fund_cluster,
          date: new Date(createDepositDto.date),
          bank_account_no: createDepositDto.bank_account_no,
          deposit_no: createDepositDto.deposit_no,
          status: DepositStatus.DRAFT,
        } as NewDeposit)
        .returning();

      return plainToInstance(DepositResponseDto, deposit);
    });
  }

  async findAll(
    paginationQuery: DepositsPaginationQueryDto,
  ): Promise<{ data: DepositResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, search, status, fund_cluster, sortByDate } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(ilike(deposits.deposit_no, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(deposits.status, status));
    }
    if (fund_cluster) {
      conditions.push(eq(deposits.fund_cluster, fund_cluster));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = sortByDate === 'asc' ? asc(deposits.date) : desc(deposits.date);

    const [dataRows, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select()
        .from(deposits)
        .where(whereClause)
        .orderBy(orderBy, desc(deposits.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(deposits).where(whereClause),
    ]);

    const data = dataRows.map((row) => plainToInstance(DepositResponseDto, row));
    return { data, totalItems };
  }

  async findOne(id: string): Promise<DepositResponseDto> {
    const rows = await this.db.select().from(deposits).where(eq(deposits.id, id));
    if (rows.length === 0) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }
    return plainToInstance(DepositResponseDto, rows[0]);
  }

  async update(id: string, updateDepositDto: UpdateDepositDto): Promise<DepositResponseDto> {
    const existingRows = await this.db.select().from(deposits).where(eq(deposits.id, id));
    if (existingRows.length === 0) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }
    const existing = existingRows[0];
    if (existing.status !== DepositStatus.DRAFT) {
      throw new UnprocessableEntityException(
        `Deposit can only be updated when status is DRAFT. Current status: ${existing.status}`,
      );
    }

    const updateData: {
      fund_cluster?: FundCluster;
      date?: Date;
      bank_account_no?: BankAccountType;
      deposit_no?: string;
    } = {};
    if (updateDepositDto.fund_cluster !== undefined) {
      updateData.fund_cluster = updateDepositDto.fund_cluster;
    }
    if (updateDepositDto.date !== undefined) {
      updateData.date = new Date(updateDepositDto.date);
    }
    if (updateDepositDto.bank_account_no !== undefined) {
      updateData.bank_account_no = updateDepositDto.bank_account_no;
    }
    if (updateDepositDto.deposit_no !== undefined) {
      updateData.deposit_no = updateDepositDto.deposit_no;
    }

    if (Object.keys(updateData).length === 0) {
      return plainToInstance(DepositResponseDto, existing);
    }

    const [updated] = await this.db.update(deposits).set(updateData).where(eq(deposits.id, id)).returning();
    return plainToInstance(DepositResponseDto, updated);
  }

  async updateStatus(id: string, status: DepositStatus, remarks?: string): Promise<DepositResponseDto> {
    const existing = await this.db.select().from(deposits).where(eq(deposits.id, id));
    if (existing.length === 0) {
      throw new NotFoundException(`Deposit with ID ${id} not found`);
    }

    const updateData: { status: DepositStatus; remarks?: string } = { status };
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const [updated] = await this.db.update(deposits).set(updateData).where(eq(deposits.id, id)).returning();
    return plainToInstance(DepositResponseDto, updated);
  }

  async remove(id: string): Promise<DepositResponseDto> {
    const deposit = await this.findOne(id);
    if (deposit.status !== DepositStatus.DRAFT) {
      throw new BadRequestException('Only draft deposits can be deleted');
    }
    await this.db.delete(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async createDepositCollection(
    userId: string,
    depositId: string,
    createDepositCollectionDto: CreateDepositCollectionDto,
  ): Promise<DepositCollectionResponseDto> {
    return await this.db.transaction(async (tx) => {
      const depositRows = await tx.select().from(deposits).where(eq(deposits.id, depositId));
      if (depositRows.length === 0) {
        throw new NotFoundException(`Deposit with ID ${depositId} not found`);
      }
      const deposit = depositRows[0];
      if (deposit.status !== DepositStatus.DRAFT) {
        throw new UnprocessableEntityException(
          `Deposit collections can only be added when deposit status is DRAFT. Current status: ${deposit.status}`,
        );
      }

      const collectionRows = await tx
        .select()
        .from(schema.collections)
        .where(eq(schema.collections.id, createDepositCollectionDto.collection_id));
      if (collectionRows.length === 0) {
        throw new NotFoundException(`Collection with ID ${createDepositCollectionDto.collection_id} not found`);
      }

      const existingLinks = await tx
        .select()
        .from(depositCollections)
        .where(
          and(
            eq(depositCollections.deposit_id, depositId),
            eq(depositCollections.collection_id, createDepositCollectionDto.collection_id),
          ),
        );
      if (existingLinks.length > 0) {
        throw new BadRequestException('This collection is already linked to this deposit');
      }

      const [depositCollection] = await tx
        .insert(depositCollections)
        .values({
          user_id: userId,
          deposit_id: depositId,
          collection_id: createDepositCollectionDto.collection_id,
        } as NewDepositCollection)
        .returning();

      return plainToInstance(DepositCollectionResponseDto, depositCollection);
    });
  }

  async createDepositJournalEntry(
    userId: string,
    depositId: string,
    createDepositJournalEntryDto: CreateDepositJournalEntryDto,
  ): Promise<DepositJournalEntryResponseDto> {
    return await this.db.transaction(async (tx) => {
      const depositRows = await tx.select().from(deposits).where(eq(deposits.id, depositId));
      if (depositRows.length === 0) {
        throw new NotFoundException(`Deposit with ID ${depositId} not found`);
      }
      const deposit = depositRows[0];
      if (deposit.status !== DepositStatus.DRAFT) {
        throw new UnprocessableEntityException(
          `Deposit journal entries can only be added when deposit status is DRAFT. Current status: ${deposit.status}`,
        );
      }

      if (createDepositJournalEntryDto.debit === 0 && createDepositJournalEntryDto.credit === 0) {
        throw new BadRequestException('At least one of debit or credit must be greater than 0');
      }

      const uacsRows = await tx
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, createDepositJournalEntryDto.uacs_id));
      if (uacsRows.length === 0) {
        throw new NotFoundException(
          `UACS (Revised Chart of Accounts) with ID ${createDepositJournalEntryDto.uacs_id} not found`,
        );
      }

      if (createDepositJournalEntryDto.paps_id) {
        const papsRows = await tx
          .select()
          .from(schema.paps)
          .where(eq(schema.paps.id, createDepositJournalEntryDto.paps_id));
        if (papsRows.length === 0) {
          throw new NotFoundException(`PAP with ID ${createDepositJournalEntryDto.paps_id} not found`);
        }
      }

      const [depositJournalEntry] = await tx
        .insert(depositJournalEntries)
        .values({
          user_id: userId,
          deposit_id: depositId,
          paps_id: createDepositJournalEntryDto.paps_id || null,
          uacs_id: createDepositJournalEntryDto.uacs_id,
          debit: Math.round(createDepositJournalEntryDto.debit * 100),
          credit: Math.round(createDepositJournalEntryDto.credit * 100),
        } as NewDepositJournalEntry)
        .returning();

      return plainToInstance(DepositJournalEntryResponseDto, depositJournalEntry);
    });
  }

  async findAllDepositCollections(depositId: string): Promise<DepositCollectionItemDto[]> {
    const links = await this.db
      .select({ collection_id: depositCollections.collection_id })
      .from(depositCollections)
      .where(eq(depositCollections.deposit_id, depositId));

    if (links.length === 0) return [];

    const collectionIds = links.map((l) => l.collection_id);
    const rows = await this.db
      .select({
        id: schema.collections.id,
        fund_cluster: schema.collections.fund_cluster,
        date: schema.collections.date,
        or_number: schema.collections.or_number,
        collection_type: schema.collections.collection_type,
        particulars: schema.collections.particulars,
        payor_name: schema.payees.name,
      })
      .from(schema.collections)
      .leftJoin(schema.payees, eq(schema.collections.payor_id, schema.payees.id))
      .where(inArray(schema.collections.id, collectionIds));

    const sums = await this.db
      .select({
        collection_id: schema.collectionDetails.collection_id,
        total_credit: sql<number>`coalesce(sum(${schema.collectionDetails.credit}), 0)::int`,
      })
      .from(schema.collectionDetails)
      .where(inArray(schema.collectionDetails.collection_id, collectionIds))
      .groupBy(schema.collectionDetails.collection_id);

    const totalByCollectionId = Object.fromEntries(sums.map((s) => [s.collection_id, s.total_credit]));

    const items: DepositCollectionItemDto[] = rows.map((r) => ({
      id: r.id,
      fund_cluster: r.fund_cluster,
      date: r.date.toISOString(),
      or_number: r.or_number,
      payor: r.payor_name ?? '',
      collection_type: r.collection_type,
      particular: r.particulars,
      amount: totalByCollectionId[r.id] ?? 0,
    }));

    return plainToInstance(DepositCollectionItemDto, items);
  }

  async findAllDepositJournalEntries(depositId: string): Promise<DepositJournalEntryResponseDto[]> {
    const rows = await this.db
      .select({
        id: depositJournalEntries.id,
        deposit_id: depositJournalEntries.deposit_id,
        paps_id: depositJournalEntries.paps_id,
        uacs_id: depositJournalEntries.uacs_id,
        debit: depositJournalEntries.debit,
        credit: depositJournalEntries.credit,
        created_at: depositJournalEntries.created_at,
        updated_at: depositJournalEntries.updated_at,
        pap_code: schema.paps.code,
        pap_name: schema.paps.name,
        uacs_code: schema.revisedChartOfAccounts.code,
        uacs_name: schema.revisedChartOfAccounts.name,
      })
      .from(depositJournalEntries)
      .leftJoin(schema.paps, eq(depositJournalEntries.paps_id, schema.paps.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(depositJournalEntries.uacs_id, schema.revisedChartOfAccounts.id))
      .where(eq(depositJournalEntries.deposit_id, depositId));

    return rows.map((r) =>
      plainToInstance(DepositJournalEntryResponseDto, {
        id: r.id,
        deposit_id: r.deposit_id,
        paps_id: r.paps_id,
        pap_code: r.pap_code,
        pap_name: r.pap_name,
        uacs_id: r.uacs_id,
        uacs_code: r.uacs_code,
        uacs_name: r.uacs_name,
        debit: r.debit,
        credit: r.credit,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }),
    );
  }

  async removeDepositCollection(depositId: string, collectionId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const depositRows = await tx.select().from(deposits).where(eq(deposits.id, depositId));
      if (depositRows.length === 0) {
        throw new NotFoundException(`Deposit with ID ${depositId} not found`);
      }
      if (depositRows[0].status !== DepositStatus.DRAFT) {
        throw new UnprocessableEntityException('Deposit collections can only be removed when deposit status is DRAFT');
      }
      const existing = await tx
        .select()
        .from(depositCollections)
        .where(and(eq(depositCollections.deposit_id, depositId), eq(depositCollections.collection_id, collectionId)));
      if (existing.length === 0) {
        throw new NotFoundException(`No link found between deposit ${depositId} and collection ${collectionId}`);
      }
      await tx
        .delete(depositCollections)
        .where(and(eq(depositCollections.deposit_id, depositId), eq(depositCollections.collection_id, collectionId)));
    });
  }

  async updateDepositCollection(depositId: string, collectionId: string): Promise<DepositCollectionResponseDto> {
    await this.db.transaction(async (tx) => {
      const depositRows = await tx.select().from(deposits).where(eq(deposits.id, depositId));
      if (depositRows.length === 0) {
        throw new NotFoundException(`Deposit with ID ${depositId} not found`);
      }
      if (depositRows[0].status !== DepositStatus.DRAFT) {
        throw new UnprocessableEntityException('Deposit collections can only be updated when deposit status is DRAFT');
      }
      const existing = await tx
        .select()
        .from(depositCollections)
        .where(and(eq(depositCollections.deposit_id, depositId), eq(depositCollections.collection_id, collectionId)));
      if (existing.length === 0) {
        throw new NotFoundException(`No link found between deposit ${depositId} and collection ${collectionId}`);
      }
    });
    return plainToInstance(DepositCollectionResponseDto, { deposit_id: depositId, collection_id: collectionId });
  }

  async removeDepositJournalEntry(depositId: string, entryId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const depositRows = await tx.select().from(deposits).where(eq(deposits.id, depositId));
      if (depositRows.length === 0) {
        throw new NotFoundException(`Deposit with ID ${depositId} not found`);
      }
      if (depositRows[0].status !== DepositStatus.DRAFT) {
        throw new UnprocessableEntityException(
          'Deposit journal entries can only be removed when deposit status is DRAFT',
        );
      }
      const entries = await tx
        .select()
        .from(depositJournalEntries)
        .where(and(eq(depositJournalEntries.deposit_id, depositId), eq(depositJournalEntries.id, entryId)));
      if (entries.length === 0) {
        throw new NotFoundException(`Journal entry ${entryId} not found for deposit ${depositId}`);
      }
      await tx
        .delete(depositJournalEntries)
        .where(and(eq(depositJournalEntries.deposit_id, depositId), eq(depositJournalEntries.id, entryId)));
    });
  }

  async updateDepositJournalEntry(
    depositId: string,
    entryId: string,
    updateData: { paps_id?: string; uacs_id?: string; debit?: number; credit?: number },
  ): Promise<DepositJournalEntryResponseDto> {
    return await this.db.transaction(async (tx) => {
      const depositRows = await tx.select().from(deposits).where(eq(deposits.id, depositId));
      if (depositRows.length === 0) {
        throw new NotFoundException(`Deposit with ID ${depositId} not found`);
      }
      if (depositRows[0].status !== DepositStatus.DRAFT) {
        throw new UnprocessableEntityException(
          'Deposit journal entries can only be updated when deposit status is DRAFT',
        );
      }
      const entries = await tx
        .select()
        .from(depositJournalEntries)
        .where(and(eq(depositJournalEntries.deposit_id, depositId), eq(depositJournalEntries.id, entryId)));
      if (entries.length === 0) {
        throw new NotFoundException(`Journal entry ${entryId} not found for deposit ${depositId}`);
      }

      const updateFields: {
        paps_id: string | null;
        uacs_id?: string;
        debit?: number;
        credit?: number;
      } = { paps_id: entries[0].paps_id };

      if (updateData.paps_id !== undefined) {
        if (updateData.paps_id) {
          const papsRows = await tx.select().from(schema.paps).where(eq(schema.paps.id, updateData.paps_id));
          if (papsRows.length === 0) {
            throw new NotFoundException(`PAP with ID ${updateData.paps_id} not found`);
          }
        }
        updateFields.paps_id = updateData.paps_id || null;
      }

      if (updateData.uacs_id !== undefined) {
        const uacsRows = await tx
          .select()
          .from(schema.revisedChartOfAccounts)
          .where(eq(schema.revisedChartOfAccounts.id, updateData.uacs_id));
        if (uacsRows.length === 0) {
          throw new NotFoundException(`UACS with ID ${updateData.uacs_id} not found`);
        }
        updateFields.uacs_id = updateData.uacs_id;
      }

      if (updateData.debit !== undefined) {
        updateFields.debit = Math.round(updateData.debit * 100);
      }

      if (updateData.credit !== undefined) {
        updateFields.credit = Math.round(updateData.credit * 100);
      }

      const finalDebit = updateFields.debit ?? entries[0].debit;
      const finalCredit = updateFields.credit ?? entries[0].credit;

      if (finalDebit === 0 && finalCredit === 0) {
        throw new BadRequestException('At least one of debit or credit must be greater than 0');
      }

      await tx
        .update(depositJournalEntries)
        .set(updateFields)
        .where(and(eq(depositJournalEntries.deposit_id, depositId), eq(depositJournalEntries.id, entryId)));

      const result = await tx
        .select({
          id: depositJournalEntries.id,
          deposit_id: depositJournalEntries.deposit_id,
          paps_id: depositJournalEntries.paps_id,
          uacs_id: depositJournalEntries.uacs_id,
          debit: depositJournalEntries.debit,
          credit: depositJournalEntries.credit,
          created_at: depositJournalEntries.created_at,
          updated_at: depositJournalEntries.updated_at,
          pap_code: schema.paps.code,
          pap_name: schema.paps.name,
          uacs_code: schema.revisedChartOfAccounts.code,
          uacs_name: schema.revisedChartOfAccounts.name,
        })
        .from(depositJournalEntries)
        .leftJoin(schema.paps, eq(depositJournalEntries.paps_id, schema.paps.id))
        .leftJoin(schema.revisedChartOfAccounts, eq(depositJournalEntries.uacs_id, schema.revisedChartOfAccounts.id))
        .where(eq(depositJournalEntries.id, entryId));

      const r = result[0];
      return plainToInstance(DepositJournalEntryResponseDto, {
        id: r.id,
        deposit_id: r.deposit_id,
        paps_id: r.paps_id,
        pap_code: r.pap_code,
        pap_name: r.pap_name,
        uacs_id: r.uacs_id,
        uacs_code: r.uacs_code,
        uacs_name: r.uacs_name,
        debit: r.debit,
        credit: r.credit,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    });
  }
}
