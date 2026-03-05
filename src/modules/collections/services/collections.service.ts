import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, count, desc, asc, ilike, between, SQL, inArray, sql, not } from 'drizzle-orm';
import { CreateCollectionDto } from '../dto/create-collection.dto';
import { UpdateCollectionDto } from '../dto/update-collection.dto';
import { CollectionResponseDto } from '../dto/collection-response.dto';
import { CollectionPaginationQueryDto } from '../dto/collection-pagination-query.dto';
import { DATABASE_CONNECTION } from '@/config/database.config';
import * as schema from '@/database/schemas';
import { collections, CollectionStatus } from '@/database/schemas/collections.schema';
import { payees } from '@/database/schemas/payees.schema';
import { collectionDetails } from '@/database/schemas/collection-details.schema';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CollectionsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(
    paginationQuery: CollectionPaginationQueryDto,
  ): Promise<{ data: CollectionResponseDto[]; totalItems: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      date,
      status,
      fund_cluster,
      collection_type,
      payor_id,
      spoiled,
      user_id,
      sortByDate,
      sortByOrNumber,
      unlinkedToDeposit,
    } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (unlinkedToDeposit) {
      const linkedRows = await this.db
        .select({ collection_id: schema.depositCollections.collection_id })
        .from(schema.depositCollections);
      const linkedCollectionIds = [...new Set(linkedRows.map((r) => r.collection_id))];
      if (linkedCollectionIds.length > 0) {
        conditions.push(not(inArray(collections.id, linkedCollectionIds)));
      }
    }

    if (search) {
      const searchCondition = or(
        ilike(collections.or_number, `%${search}%`),
        ilike(collections.particulars, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status) {
      conditions.push(eq(collections.status, status));
    }

    if (fund_cluster) {
      conditions.push(eq(collections.fund_cluster, fund_cluster));
    }

    if (collection_type) {
      conditions.push(eq(collections.collection_type, collection_type));
    }

    if (payor_id) {
      conditions.push(eq(collections.payor_id, payor_id));
    }

    if (spoiled) {
      conditions.push(eq(collections.spoiled, spoiled));
    }

    if (user_id) {
      conditions.push(eq(collections.user_id, user_id));
    }

    if (date) {
      const dates = date.split(',').map((d) => d.trim());
      if (dates.length === 1) {
        const startOfDay = new Date(dates[0]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dates[0]);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(between(collections.date, startOfDay, endOfDay));
      } else if (dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(between(collections.date, startDate, endDate));
      }
    }

    const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause: SQL[] = [];

    if (sortByOrNumber) {
      orderByClause.push(sortByOrNumber === 'asc' ? asc(collections.or_number) : desc(collections.or_number));
    }

    if (sortByDate) {
      orderByClause.push(sortByDate === 'asc' ? asc(collections.date) : desc(collections.date));
    }

    if (orderByClause.length === 0) {
      orderByClause.push(desc(collections.date), desc(collections.created_at));
    } else {
      orderByClause.push(desc(collections.created_at));
    }

    const [rows, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select({
          id: collections.id,
          user_id: collections.user_id,
          fund_cluster: collections.fund_cluster,
          or_number: collections.or_number,
          date: collections.date,
          status: collections.status,
          payor_id: collections.payor_id,
          collection_type: collections.collection_type,
          particulars: collections.particulars,
          remarks: collections.remarks,
          spoiled: collections.spoiled,
          workflow_id: collections.workflow_id,
          created_at: collections.created_at,
          updated_at: collections.updated_at,
          payor_name: payees.name,
        })
        .from(collections)
        .leftJoin(payees, eq(collections.payor_id, payees.id))
        .where(whereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(collections).where(whereConditions),
    ]);

    const collectionIds = rows.map((r) => r.id);
    let totalCreditByCollectionId: Record<string, number> = {};
    if (collectionIds.length > 0) {
      const sums = await this.db
        .select({
          collection_id: collectionDetails.collection_id,
          total_credit: sql<number>`coalesce(sum(${collectionDetails.credit}), 0)::int`,
        })
        .from(collectionDetails)
        .where(inArray(collectionDetails.collection_id, collectionIds))
        .groupBy(collectionDetails.collection_id);
      totalCreditByCollectionId = Object.fromEntries(sums.map((s) => [s.collection_id, s.total_credit]));
    }

    const data = rows.map((row) => {
      const { payor_name, ...rest } = row;
      return {
        ...rest,
        payor_name: payor_name ?? null,
        total_credit: totalCreditByCollectionId[row.id] ?? 0,
      };
    });

    return {
      data: plainToInstance(CollectionResponseDto, data),
      totalItems,
    };
  }

  async create(userId: string, createCollectionDto: CreateCollectionDto): Promise<CollectionResponseDto> {
    return await this.db.transaction(async (tx) => {
      const [collection] = await tx
        .insert(collections)
        .values({
          user_id: userId,
          fund_cluster: createCollectionDto.fund_cluster,
          or_number: createCollectionDto.or_number,
          date: new Date(createCollectionDto.date),
          status: CollectionStatus.DRAFT,
          payor_id: createCollectionDto.payor_id,
          collection_type: createCollectionDto.collection_type,
          particulars: createCollectionDto.particulars,
          remarks: createCollectionDto.remarks,
          spoiled: createCollectionDto.spoiled,
        })
        .returning();

      return plainToInstance(CollectionResponseDto, { ...collection, total_credit: 0 });
    });
  }

  async findOne(id: string): Promise<CollectionResponseDto> {
    const rows = await this.db
      .select({
        id: collections.id,
        user_id: collections.user_id,
        fund_cluster: collections.fund_cluster,
        or_number: collections.or_number,
        date: collections.date,
        status: collections.status,
        payor_id: collections.payor_id,
        collection_type: collections.collection_type,
        particulars: collections.particulars,
        remarks: collections.remarks,
        spoiled: collections.spoiled,
        workflow_id: collections.workflow_id,
        created_at: collections.created_at,
        updated_at: collections.updated_at,
        payor_name: payees.name,
      })
      .from(collections)
      .leftJoin(payees, eq(collections.payor_id, payees.id))
      .where(eq(collections.id, id));

    if (rows.length === 0) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    const [sumRow] = await this.db
      .select({
        total_credit: sql<number>`coalesce(sum(${collectionDetails.credit}), 0)::int`,
      })
      .from(collectionDetails)
      .where(eq(collectionDetails.collection_id, id));
    const total_credit = sumRow.total_credit;

    const row = rows[0];
    const { payor_name, ...rest } = row;
    const data = { ...rest, payor_name: payor_name ?? null, total_credit };
    return plainToInstance(CollectionResponseDto, data);
  }

  async update(id: string, updateCollectionDto: UpdateCollectionDto): Promise<CollectionResponseDto> {
    return await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(collections).where(eq(collections.id, id));
      if (existing.length === 0) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }
      if (existing[0].status !== CollectionStatus.DRAFT) {
        throw new BadRequestException('Only draft collections can be edited');
      }

      const updateData: Record<string, unknown> = {};
      if (updateCollectionDto.fund_cluster !== undefined) updateData.fund_cluster = updateCollectionDto.fund_cluster;
      if (updateCollectionDto.or_number !== undefined) updateData.or_number = updateCollectionDto.or_number;
      if (updateCollectionDto.date !== undefined) updateData.date = new Date(updateCollectionDto.date);
      if (updateCollectionDto.payor_id !== undefined) updateData.payor_id = updateCollectionDto.payor_id;
      if (updateCollectionDto.collection_type !== undefined)
        updateData.collection_type = updateCollectionDto.collection_type;
      if (updateCollectionDto.particulars !== undefined) updateData.particulars = updateCollectionDto.particulars;
      if (updateCollectionDto.remarks !== undefined) updateData.remarks = updateCollectionDto.remarks;
      if (updateCollectionDto.spoiled !== undefined) updateData.spoiled = updateCollectionDto.spoiled;

      if (Object.keys(updateData).length === 0) {
        return this.findOne(id);
      }

      await tx.update(collections).set(updateData).where(eq(collections.id, id));
      return this.findOne(id);
    });
  }

  async updateStatus(id: string, status: CollectionStatus, remarks?: string): Promise<CollectionResponseDto> {
    return await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(collections).where(eq(collections.id, id));
      if (existing.length === 0) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }

      const updateData: { status: CollectionStatus; remarks?: string } = { status };
      if (remarks !== undefined) {
        updateData.remarks = remarks;
      }

      await tx.update(collections).set(updateData).where(eq(collections.id, id));
      return this.findOne(id);
    });
  }

  async updateWorkflowId(id: string, workflowId: string): Promise<CollectionResponseDto> {
    return await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(collections).where(eq(collections.id, id));
      if (existing.length === 0) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }

      await tx.update(collections).set({ workflow_id: workflowId }).where(eq(collections.id, id));
      return this.findOne(id);
    });
  }

  async remove(id: string): Promise<CollectionResponseDto> {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
          id: collections.id,
          user_id: collections.user_id,
          fund_cluster: collections.fund_cluster,
          or_number: collections.or_number,
          date: collections.date,
          status: collections.status,
          payor_id: collections.payor_id,
          collection_type: collections.collection_type,
          particulars: collections.particulars,
          remarks: collections.remarks,
          spoiled: collections.spoiled,
          created_at: collections.created_at,
          updated_at: collections.updated_at,
          payor_name: payees.name,
        })
        .from(collections)
        .leftJoin(payees, eq(collections.payor_id, payees.id))
        .where(eq(collections.id, id));

      if (rows.length === 0) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }
      if (rows[0].status !== CollectionStatus.DRAFT) {
        throw new BadRequestException('Only draft collections can be deleted');
      }

      const [sumRow] = await tx
        .select({
          total_credit: sql<number>`coalesce(sum(${collectionDetails.credit}), 0)::int`,
        })
        .from(collectionDetails)
        .where(eq(collectionDetails.collection_id, id));
      const total_credit = sumRow.total_credit;

      await tx.delete(collections).where(eq(collections.id, id));

      const row = rows[0];
      const { payor_name, ...rest } = row;
      const data = { ...rest, payor_name: payor_name ?? null, total_credit };
      return plainToInstance(CollectionResponseDto, data);
    });
  }
}
