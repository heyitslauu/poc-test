import { Inject, Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, count, desc, asc, ilike, or, and, SQL, between } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { CreateObligationDto } from '../dtos/create-obligation.dto';
import { UpdateObligationDto } from '../dtos/update-obligation.dto';
import { ObligationsPaginationQueryDto } from '../dtos/obligations-pagination-query.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { obligations, NewObligation, ObligationStatus, Obligation } from '../../../database/schemas';
import { plainToInstance } from 'class-transformer';
import { ObligationResponseDto } from '../dtos/obligation-response.dto';
import { FundCluster } from '../../../database/schemas/allotments.schema';
import { PayeeType } from '../../../database/schemas/payees.schema';
import { ObligationDetailsService } from './obligation-details.service';

interface ObligationWithPayee {
  id: string;
  user_id: string;
  payee_id: string;
  fund_cluster: FundCluster | null;
  ors_number: string | null;
  tracking_reference: string;
  particulars: string;
  date: Date;
  transaction_type: string | null;
  amount: number;
  status: ObligationStatus;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
  payee: {
    type: PayeeType;
    name: string | null;
  } | null;
}

@Injectable()
export class ObligationsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly obligationDetailsService: ObligationDetailsService,
  ) {}

  async create(userId: string, createObligationDto: CreateObligationDto): Promise<ObligationResponseDto> {
    return await this.db.transaction(async (tx) => {
      const payees = await tx.select().from(schema.payees).where(eq(schema.payees.id, createObligationDto.payee_id));
      if (payees.length === 0) {
        throw new NotFoundException('Payee not found');
      }

      let trackingReference: string;
      let existingTracking: Obligation[] = [];
      do {
        trackingReference = this.generateTrackingReference();
        existingTracking = await tx
          .select()
          .from(obligations)
          .where(eq(obligations.tracking_reference, trackingReference));
      } while (existingTracking.length > 0);

      const [obligation] = await tx
        .insert(obligations)
        .values({
          user_id: userId,
          payee_id: createObligationDto.payee_id,
          tracking_reference: trackingReference,
          particulars: createObligationDto.particulars,
          date: new Date(createObligationDto.date),
          transaction_type: createObligationDto.transaction_type ?? null,
          amount: createObligationDto.amount * 100,
          status: ObligationStatus.FOR_TRIAGE,
        } as NewObligation)
        .returning();

      const obligationWithPayee = await tx
        .select(this.getObligationSelectFields())
        .from(obligations)
        .leftJoin(schema.payees, eq(obligations.payee_id, schema.payees.id))
        .where(eq(obligations.id, obligation.id))
        .limit(1);

      const obligationDto = this.transformObligationWithPayee(obligationWithPayee[0]);
      obligationDto.details = [];
      return obligationDto;
    });
  }

  async findAll(
    paginationQuery: ObligationsPaginationQueryDto,
  ): Promise<{ data: ObligationResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, search, date, status, fund_cluster, transaction_type, sortByDate } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      const searchCondition = or(
        ilike(obligations.ors_number, `%${search}%`),
        ilike(obligations.tracking_reference, `%${search}%`),
        ilike(obligations.particulars, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status) {
      conditions.push(eq(obligations.status, status));
    }

    if (fund_cluster) {
      conditions.push(eq(obligations.fund_cluster, fund_cluster));
    }

    if (transaction_type) {
      conditions.push(eq(obligations.transaction_type, transaction_type));
    }

    if (date) {
      const dates = date.split(',').map((d) => d.trim());
      if (dates.length === 1) {
        const startOfDay = new Date(dates[0]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dates[0]);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(between(obligations.date, startOfDay, endOfDay));
      } else if (dates.length === 2) {
        const startDate = new Date(dates[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dates[1]);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(between(obligations.date, startDate, endDate));
      }
    }

    const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByClause: SQL[] = [];

    if (sortByDate) {
      orderByClause.push(sortByDate === 'asc' ? asc(obligations.date) : desc(obligations.date));
    }

    orderByClause.push(desc(obligations.created_at));

    const [obligationsList, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select(this.getObligationSelectFields())
        .from(obligations)
        .leftJoin(schema.payees, eq(obligations.payee_id, schema.payees.id))
        .where(whereConditions)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(obligations).where(whereConditions),
    ]);

    const data = obligationsList.map((obligation) => this.transformObligationWithPayee(obligation));

    for (const obligation of data) {
      const details = await this.obligationDetailsService.findAll(obligation.id, {});
      obligation.details = details.data;
    }

    return { data, totalItems };
  }

  async findOne(id: string): Promise<ObligationResponseDto> {
    const obligationList = await this.db
      .select(this.getObligationSelectFields())
      .from(obligations)
      .leftJoin(schema.payees, eq(obligations.payee_id, schema.payees.id))
      .where(eq(obligations.id, id));

    if (obligationList.length === 0) {
      throw new NotFoundException(`Obligation with ID ${id} not found`);
    }

    const obligation = this.transformObligationWithPayee(obligationList[0]);
    const details = await this.obligationDetailsService.findAll(id, {});
    obligation.details = details.data;

    return obligation;
  }

  async update(id: string, updateObligationDto: UpdateObligationDto): Promise<ObligationResponseDto> {
    return await this.db.transaction(async (tx) => {
      const existingObligation = await tx.select().from(obligations).where(eq(obligations.id, id));

      if (existingObligation.length === 0) {
        throw new NotFoundException(`Obligation with ID ${id} not found`);
      }

      if (updateObligationDto.payee_id !== undefined) {
        const payees = await tx.select().from(schema.payees).where(eq(schema.payees.id, updateObligationDto.payee_id));
        if (payees.length === 0) {
          throw new NotFoundException('Payee not found');
        }
      }

      const updateData: Partial<NewObligation> = {};

      if (updateObligationDto.payee_id !== undefined) {
        updateData.payee_id = updateObligationDto.payee_id;
      }
      if (updateObligationDto.fund_cluster !== undefined) {
        updateData.fund_cluster = updateObligationDto.fund_cluster;
      }
      if (updateObligationDto.particulars !== undefined) {
        updateData.particulars = updateObligationDto.particulars;
      }
      if (updateObligationDto.date !== undefined) {
        updateData.date = new Date(updateObligationDto.date);
      }
      if (updateObligationDto.transaction_type !== undefined) {
        updateData.transaction_type = updateObligationDto.transaction_type;
      }
      if (updateObligationDto.amount !== undefined) {
        updateData.amount = updateObligationDto.amount * 100;
      }
      if (updateObligationDto.remarks !== undefined) {
        updateData.remarks = updateObligationDto.remarks;
      }

      await tx.update(obligations).set(updateData).where(eq(obligations.id, id));

      const updatedObligation = await tx
        .select(this.getObligationSelectFields())
        .from(obligations)
        .leftJoin(schema.payees, eq(obligations.payee_id, schema.payees.id))
        .where(eq(obligations.id, id))
        .limit(1);

      const obligationDto = this.transformObligationWithPayee(updatedObligation[0]);
      const details = await this.obligationDetailsService.findAll(id, {});
      obligationDto.details = details.data;
      return obligationDto;
    });
  }

  async updateStatus(id: string, status: ObligationStatus): Promise<ObligationResponseDto> {
    const existingObligation = await this.db.select().from(obligations).where(eq(obligations.id, id));

    if (existingObligation.length === 0) {
      throw new NotFoundException(`Obligation with ID ${id} not found`);
    }

    if (existingObligation[0].status === ObligationStatus.APPROVED && status === ObligationStatus.APPROVED) {
      throw new ConflictException('Obligation is already approved');
    }

    const updateData: { status: ObligationStatus; ors_number?: string } = { status };

    if (status === ObligationStatus.APPROVED) {
      if (!existingObligation[0].fund_cluster) {
        throw new BadRequestException('Fund cluster is required to approve obligation');
      }

      const fundCluster = existingObligation[0].fund_cluster;
      updateData.ors_number = await this.generateOrsNumber(fundCluster);
    }

    const result = await this.db.update(obligations).set(updateData).where(eq(obligations.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update obligation status with ID ${id}`);
    }

    const updatedObligation = await this.db
      .select(this.getObligationSelectFields())
      .from(obligations)
      .leftJoin(schema.payees, eq(obligations.payee_id, schema.payees.id))
      .where(eq(obligations.id, id))
      .limit(1);

    const obligationDto = this.transformObligationWithPayee(updatedObligation[0]);
    const details = await this.obligationDetailsService.findAll(id, {});
    obligationDto.details = details.data;
    return obligationDto;
  }

  private async generateOrsNumber(fundCluster: FundCluster): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = fundCluster + '-' + year.toString() + '-';

    const relatedObligations = await this.db
      .select({ ors_number: obligations.ors_number })
      .from(obligations)
      .where(and(eq(obligations.fund_cluster, fundCluster), eq(obligations.status, ObligationStatus.APPROVED)))
      .orderBy(desc(obligations.ors_number))
      .limit(1);

    let nextNumber = 1;
    if (relatedObligations.length > 0 && relatedObligations[0].ors_number) {
      const parts = relatedObligations[0].ors_number.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    return prefix + nextNumber.toString().padStart(4, '0');
  }

  private getObligationSelectFields() {
    return {
      id: obligations.id,
      user_id: obligations.user_id,
      payee_id: obligations.payee_id,
      fund_cluster: obligations.fund_cluster,
      ors_number: obligations.ors_number,
      tracking_reference: obligations.tracking_reference,
      particulars: obligations.particulars,
      date: obligations.date,
      transaction_type: obligations.transaction_type,
      amount: obligations.amount,
      status: obligations.status,
      remarks: obligations.remarks,
      created_at: obligations.created_at,
      updated_at: obligations.updated_at,
      payee: {
        type: schema.payees.type,
        name: schema.payees.name,
      },
    };
  }

  private transformObligationWithPayee(obligation: ObligationWithPayee): ObligationResponseDto {
    const obligationDto = plainToInstance(ObligationResponseDto, obligation);
    obligationDto.payee = obligation.payee || undefined;
    return obligationDto;
  }

  private generateTrackingReference(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month: string = String(now.getMonth() + 1).padStart(2, '0');

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(8);
    let randomChars = '';
    for (let i = 0; i < 8; i++) {
      const byteValue = bytes[i];
      randomChars += chars[byteValue % chars.length];
    }

    return `EX-${String(year)}-${month}-${randomChars}`;
  }
}
