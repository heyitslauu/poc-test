import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, count, desc, asc, ilike, or, and, SQL, between, like } from 'drizzle-orm';
import { CreateEarmarkDto } from '../dto/create-earmark.dto';
import { UpdateEarmarkDto } from '../dto/update-earmark.dto';
import { EarmarksPaginationQueryDto } from '../dto/earmarks-pagination-query.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { earmarks, NewEarmark, EarmarkStatus, EarmarksFundCluster } from '../../../database/schemas';
import { plainToInstance } from 'class-transformer';
import { EarmarkResponseDto } from '../dto/earmark-response.dto';
import { EarmarkDetailsService } from './earmark-details.service';

@Injectable()
export class EarmarksService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly earmarkDetailsService: EarmarkDetailsService,
  ) {}

  async create(userId: string, createEarmarkDto: CreateEarmarkDto): Promise<EarmarkResponseDto> {
    const earmark_code = await this.generateEarmarkCode(createEarmarkDto.fund_cluster);

    const [earmark] = await this.db
      .insert(earmarks)
      .values({
        user_id: userId,
        earmark_code,
        fund_cluster: createEarmarkDto.fund_cluster,
        transaction_type: createEarmarkDto.transaction_type,
        date: new Date(createEarmarkDto.date),
        particulars: createEarmarkDto.particulars,
        status: EarmarkStatus.FOR_TRIAGE,
      } as NewEarmark)
      .returning();

    return plainToInstance(EarmarkResponseDto, earmark);
  }

  async findAll(
    paginationQuery: EarmarksPaginationQueryDto,
  ): Promise<{ data: EarmarkResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, search, date, status, fund_cluster, transaction_type, sortByDate } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      const searchCondition = or(
        ilike(earmarks.earmark_code, `%${search}%`),
        ilike(earmarks.particulars, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status) {
      conditions.push(eq(earmarks.status, status));
    }

    if (fund_cluster) {
      conditions.push(eq(earmarks.fund_cluster, fund_cluster));
    }

    if (transaction_type) {
      conditions.push(eq(earmarks.transaction_type, transaction_type));
    }

    if (date) {
      const dates = date.split(',').map((d) => d.trim());
      if (dates.length === 1) {
        const startOfDay = new Date(dates[0]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dates[0]);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(between(earmarks.date, startOfDay, endOfDay));
      } else if (dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(between(earmarks.date, startDate, endDate));
      }
    }

    const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause: SQL[] = [];
    if (sortByDate) {
      orderByClause.push(sortByDate === 'asc' ? asc(earmarks.date) : desc(earmarks.date));
    }
    orderByClause.push(desc(earmarks.created_at));

    const [earmarksList, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select()
        .from(earmarks)
        .where(whereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(earmarks).where(whereConditions),
    ]);

    const data = await Promise.all(
      earmarksList.map(async (e) => {
        const { data: details } = await this.earmarkDetailsService.findAll(e.id, { page: 1, limit: 100 });
        return plainToInstance(EarmarkResponseDto, { ...e, details });
      }),
    );
    return { data, totalItems };
  }

  async findOne(id: string): Promise<EarmarkResponseDto> {
    const earmarkList = await this.db.select().from(earmarks).where(eq(earmarks.id, id));

    if (earmarkList.length === 0) {
      throw new NotFoundException(`Earmark with ID ${id} not found`);
    }

    const { data: details } = await this.earmarkDetailsService.findAll(id, { page: 1, limit: 100 });
    return plainToInstance(EarmarkResponseDto, { ...earmarkList[0], details });
  }

  async update(id: string, updateEarmarkDto: UpdateEarmarkDto): Promise<EarmarkResponseDto> {
    const existing = await this.db.select().from(earmarks).where(eq(earmarks.id, id));

    if (existing.length === 0) {
      throw new NotFoundException(`Earmark with ID ${id} not found`);
    }

    const updateData: Partial<NewEarmark> = {};

    if (updateEarmarkDto.transaction_type !== undefined) {
      updateData.transaction_type = updateEarmarkDto.transaction_type;
    }
    if (updateEarmarkDto.date !== undefined) {
      updateData.date = new Date(updateEarmarkDto.date);
    }
    if (updateEarmarkDto.particulars !== undefined) {
      updateData.particulars = updateEarmarkDto.particulars;
    }

    const [updated] = await this.db.update(earmarks).set(updateData).where(eq(earmarks.id, id)).returning();

    return plainToInstance(EarmarkResponseDto, updated);
  }

  async updateStatus(id: string, status: EarmarkStatus): Promise<EarmarkResponseDto> {
    const existing = await this.db.select().from(earmarks).where(eq(earmarks.id, id));

    if (existing.length === 0) {
      throw new NotFoundException(`Earmark with ID ${id} not found`);
    }

    if (existing[0].status === EarmarkStatus.APPROVED && status === EarmarkStatus.APPROVED) {
      throw new ConflictException('Earmark is already approved');
    }

    const updateData: { status: EarmarkStatus } = { status };

    const [updated] = await this.db.update(earmarks).set(updateData).where(eq(earmarks.id, id)).returning();

    return plainToInstance(EarmarkResponseDto, updated);
  }

  private async generateEarmarkCode(fundCluster: EarmarksFundCluster): Promise<string> {
    const year = String(new Date().getFullYear());
    const prefix = `${fundCluster}-${year}-`;

    const related = await this.db
      .select({ earmark_code: earmarks.earmark_code })
      .from(earmarks)
      .where(and(eq(earmarks.fund_cluster, fundCluster), like(earmarks.earmark_code, `${prefix}%`)))
      .orderBy(desc(earmarks.earmark_code))
      .limit(1);

    let nextNumber = 1;
    if (related.length > 0 && related[0].earmark_code) {
      const lastPart = related[0].earmark_code.slice(prefix.length);
      const lastNumber = parseInt(lastPart, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return prefix + nextNumber.toString().padStart(4, '0');
  }
}
