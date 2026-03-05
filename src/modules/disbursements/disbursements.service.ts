import { Inject, Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, count, ilike, or, sql, and, desc, asc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { UpdateDisbursementDto } from './dto/update-disbursement.dto';
import { DisbursementResponseDto } from './dto/disbursement-response.dto';
import { DATABASE_CONNECTION } from '../../config/database.config';
import * as schema from '../../database/schemas';
import { FundCluster } from '../../database/schemas/allotments.schema';
import {
  disbursements,
  NewDisbursement,
  Disbursement,
  DisbursementStatus,
} from '../../database/schemas/disbursements.schema';
import { payees } from '../../database/schemas/payees.schema';
import {
  disbursementObligations,
  NewDisbursementObligation,
} from '../../database/schemas/disbursement-obligations.schema';
import { plainToInstance } from 'class-transformer';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { ObligationDetailsService } from '../obligations/services/obligation-details.service';

@Injectable()
export class DisbursementsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly journalEntriesService: JournalEntriesService,
    private readonly obligationDetailsService: ObligationDetailsService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: {
      fund_cluster?: FundCluster;
      status?: DisbursementStatus;
    },
    sortByDate?: 'asc' | 'desc',
    dateRange?: { startDate?: Date | string; endDate?: Date | string },
  ): Promise<{ data: DisbursementResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? or(
          ilike(disbursements.dv_number, `%${search}%`),
          ilike(disbursements.tracking_reference, `%${search}%`),
          ilike(disbursements.particulars, `%${search}%`),
          ilike(disbursements.remarks, `%${search}%`),
          ilike(disbursements.transaction_type, `%${search}%`),
          ilike(sql`${disbursements.amount}::text`, `%${search}%`),
          ilike(sql`(${disbursements.amount} / 100.0)::numeric(20, 2)::text`, `%${search}%`),
          ...(!filters?.fund_cluster ? [ilike(sql`${disbursements.fund_cluster}::text`, `%${search}%`)] : []),
          ...(!filters?.status ? [ilike(sql`${disbursements.status}::text`, `%${search}%`)] : []),
        )
      : undefined;

    const dateRangeCondition =
      dateRange && (dateRange.startDate || dateRange.endDate)
        ? and(
            ...(dateRange.startDate ? [sql`${disbursements.created_at} >= ${new Date(dateRange.startDate)}`] : []),
            ...(dateRange.endDate ? [sql`${disbursements.created_at} <= ${new Date(dateRange.endDate)}`] : []),
          )
        : undefined;

    const filterCondition = and(
      ...(filters?.fund_cluster ? [eq(disbursements.fund_cluster, filters.fund_cluster)] : []),
      ...(filters?.status ? [eq(disbursements.status, filters.status)] : []),
    );

    const whereCondition = and(
      ...(searchCondition ? [searchCondition] : []),
      ...(filterCondition ? [filterCondition] : []),
      ...(dateRangeCondition ? [dateRangeCondition] : []),
    );

    const [disbursementsList, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select({
          id: disbursements.id,
          user_id: disbursements.user_id,
          payee: {
            id: payees.id,
            type: payees.type,
            name: payees.name,
          },
          fund_cluster: disbursements.fund_cluster,
          dv_number: disbursements.dv_number,
          tracking_reference: disbursements.tracking_reference,
          particulars: disbursements.particulars,
          date: disbursements.date,
          transaction_type: disbursements.transaction_type,
          amount: disbursements.amount,
          status: disbursements.status,
          remarks: disbursements.remarks,
          created_at: disbursements.created_at,
          updated_at: disbursements.updated_at,
        })
        .from(disbursements)
        .leftJoin(payees, eq(disbursements.payee_id, payees.id))
        .where(whereCondition)
        .limit(limit)
        .orderBy(sortByDate === 'asc' ? asc(disbursements.created_at) : desc(disbursements.created_at))
        .offset(offset),
      this.db.select({ value: count() }).from(disbursements).where(whereCondition),
    ]);

    return { data: plainToInstance(DisbursementResponseDto, disbursementsList), totalItems };
  }

  async findOne(id: string): Promise<DisbursementResponseDto> {
    const result = await this.db
      .select({
        id: disbursements.id,
        user_id: disbursements.user_id,
        payee: {
          id: payees.id,
          type: payees.type,
          name: payees.name,
        },
        fund_cluster: disbursements.fund_cluster,
        dv_number: disbursements.dv_number,
        tracking_reference: disbursements.tracking_reference,
        particulars: disbursements.particulars,
        date: disbursements.date,
        transaction_type: disbursements.transaction_type,
        amount: disbursements.amount,
        status: disbursements.status,
        remarks: disbursements.remarks,
        created_at: disbursements.created_at,
        updated_at: disbursements.updated_at,
      })
      .from(disbursements)
      .leftJoin(payees, eq(disbursements.payee_id, payees.id))
      .where(eq(disbursements.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Disbursement with ID ${id} not found`);
    }

    const journal_entries = await this.journalEntriesService.findByDV(id);

    const obligations = await this.obligationDetailsService.findByDisbursementId(id);

    return plainToInstance(DisbursementResponseDto, { ...result[0], journal_entries, obligations });
  }

  async create(userId: string, createDisbursementDto: CreateDisbursementDto): Promise<DisbursementResponseDto> {
    return await this.db.transaction(async (tx) => {
      let disbursement: Disbursement | undefined;
      const maxRetries = 2;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const dvNumber = createDisbursementDto.fund_cluster
          ? await this.generateDvNumber(createDisbursementDto.fund_cluster, tx)
          : null;
        try {
          [disbursement] = await tx
            .insert(disbursements)
            .values({
              user_id: userId,
              payee_id: createDisbursementDto.payee_id,
              fund_cluster: createDisbursementDto.fund_cluster ?? null,
              dv_number: dvNumber,
              tracking_reference: this.generateTrackingReference(),
              particulars: createDisbursementDto.particulars ?? null,
              date: createDisbursementDto.date ? new Date(createDisbursementDto.date) : null,
              transaction_type: createDisbursementDto.transaction_type ?? null,
              amount: createDisbursementDto.amount ? createDisbursementDto.amount * 100 : null,
              status: DisbursementStatus.FOR_PROCESSING,
              remarks: createDisbursementDto.remarks ?? null,
              created_at: new Date(),
              updated_at: new Date(),
            } as NewDisbursement)
            .returning();

          break;
        } catch (error) {
          if (error instanceof Error && (this.isTrackingReferenceConflict(error) || this.isDvNumberConflict(error))) {
            if (attempt === maxRetries - 1) {
              throw new InternalServerErrorException(
                'Failed to generate unique tracking reference or DV number after multiple attempts',
              );
            }
            continue;
          }
          throw error;
        }
      }

      if (!disbursement) {
        throw new InternalServerErrorException('Unexpected error: Disbursement was not created');
      }

      return plainToInstance(DisbursementResponseDto, disbursement);
    });
  }

  async update(id: string, updateDisbursementDto: UpdateDisbursementDto): Promise<DisbursementResponseDto> {
    return await this.db.transaction(async (tx) => {
      const existingDisbursement = await tx.select().from(disbursements).where(eq(disbursements.id, id));

      if (existingDisbursement.length === 0) {
        throw new NotFoundException(`Disbursement with ID ${id} not found`);
      }

      if (updateDisbursementDto.payee_id !== undefined) {
        const payeeExists = await tx.select().from(payees).where(eq(payees.id, updateDisbursementDto.payee_id));
        if (payeeExists.length === 0) {
          throw new NotFoundException('Payee not found');
        }
      }

      const updateData: Partial<NewDisbursement> = {};

      if (updateDisbursementDto.payee_id !== undefined) {
        updateData.payee_id = updateDisbursementDto.payee_id;
      }
      if (updateDisbursementDto.fund_cluster !== undefined) {
        updateData.fund_cluster = updateDisbursementDto.fund_cluster;
      }
      if (updateDisbursementDto.particulars !== undefined) {
        updateData.particulars = updateDisbursementDto.particulars;
      }
      if (updateDisbursementDto.date !== undefined) {
        updateData.date = new Date(updateDisbursementDto.date);
      }
      if (updateDisbursementDto.transaction_type !== undefined) {
        updateData.transaction_type = updateDisbursementDto.transaction_type;
      }
      if (updateDisbursementDto.amount !== undefined) {
        updateData.amount = updateDisbursementDto.amount * 100;
      }
      if (updateDisbursementDto.remarks !== undefined) {
        updateData.remarks = updateDisbursementDto.remarks;
      }

      await tx.update(disbursements).set(updateData).where(eq(disbursements.id, id));

      const updatedDisbursement = await tx
        .select({
          id: disbursements.id,
          user_id: disbursements.user_id,
          payee: {
            id: payees.id,
            type: payees.type,
            name: payees.name,
          },
          fund_cluster: disbursements.fund_cluster,
          dv_number: disbursements.dv_number,
          tracking_reference: disbursements.tracking_reference,
          particulars: disbursements.particulars,
          date: disbursements.date,
          transaction_type: disbursements.transaction_type,
          amount: disbursements.amount,
          status: disbursements.status,
          remarks: disbursements.remarks,
          created_at: disbursements.created_at,
          updated_at: disbursements.updated_at,
        })
        .from(disbursements)
        .leftJoin(payees, eq(disbursements.payee_id, payees.id))
        .where(eq(disbursements.id, id))
        .limit(1);

      return plainToInstance(DisbursementResponseDto, updatedDisbursement[0]);
    });
  }

  async updateStatus(id: string, status: DisbursementStatus): Promise<DisbursementResponseDto> {
    return await this.db.transaction(async (tx) => {
      const existingDisbursement = await tx.select().from(disbursements).where(eq(disbursements.id, id));

      if (existingDisbursement.length === 0) {
        throw new NotFoundException(`Disbursement with ID ${id} not found`);
      }

      if (existingDisbursement[0].status === DisbursementStatus.APPROVED && status === DisbursementStatus.APPROVED) {
        throw new ConflictException('Disbursement is already approved');
      }

      const updateData: { status: DisbursementStatus; dv_number?: string } = { status };

      const result = await tx.update(disbursements).set(updateData).where(eq(disbursements.id, id)).returning();

      if (result.length === 0) {
        throw new NotFoundException(`Unable to update disbursement status with ID ${id}`);
      }

      const updatedDisbursement = await tx
        .select({
          id: disbursements.id,
          user_id: disbursements.user_id,
          payee: {
            id: payees.id,
            type: payees.type,
            name: payees.name,
          },
          fund_cluster: disbursements.fund_cluster,
          dv_number: disbursements.dv_number,
          tracking_reference: disbursements.tracking_reference,
          particulars: disbursements.particulars,
          date: disbursements.date,
          transaction_type: disbursements.transaction_type,
          amount: disbursements.amount,
          status: disbursements.status,
          remarks: disbursements.remarks,
          created_at: disbursements.created_at,
          updated_at: disbursements.updated_at,
        })
        .from(disbursements)
        .leftJoin(payees, eq(disbursements.payee_id, payees.id))
        .where(eq(disbursements.id, id))
        .limit(1);

      return plainToInstance(DisbursementResponseDto, updatedDisbursement[0]);
    });
  }

  async attachObligation(userId: string, disbursementId: string, obligationDetailId: string): Promise<void> {
    const existingDisbursement = await this.db.select().from(disbursements).where(eq(disbursements.id, disbursementId));

    if (existingDisbursement.length === 0) {
      throw new NotFoundException(`Disbursement with ID ${disbursementId} not found`);
    }

    await this.db.insert(disbursementObligations).values({
      user_id: userId,
      disbursement_id: disbursementId,
      obligation_detail_id: obligationDetailId,
      created_at: new Date(),
      updated_at: new Date(),
    } as NewDisbursementObligation);
  }

  async detachObligation(disbursementId: string, obligationDetailId: string): Promise<void> {
    const existingAttachment = await this.db
      .select()
      .from(disbursementObligations)
      .where(
        and(
          eq(disbursementObligations.disbursement_id, disbursementId),
          eq(disbursementObligations.obligation_detail_id, obligationDetailId),
        ),
      );

    if (existingAttachment.length === 0) {
      throw new NotFoundException(
        `Obligation detail with ID ${obligationDetailId} is not attached to disbursement ${disbursementId}`,
      );
    }

    await this.db
      .delete(disbursementObligations)
      .where(
        and(
          eq(disbursementObligations.disbursement_id, disbursementId),
          eq(disbursementObligations.obligation_detail_id, obligationDetailId),
        ),
      );
  }

  private async generateDvNumber(fundCluster: FundCluster, tx: NodePgDatabase<typeof schema>): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // YY
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM
    const prefix = `${year}-${month}-`;

    // Lock the table to prevent race conditions
    await tx.execute(sql`LOCK TABLE ${disbursements} IN EXCLUSIVE MODE`);

    const latestDisbursement = await tx
      .select({ dv_number: disbursements.dv_number })
      .from(disbursements)
      .where(ilike(disbursements.dv_number, `${prefix}%`))
      .orderBy(desc(disbursements.dv_number))
      .limit(1);

    let nextNumber = 1;
    if (latestDisbursement.length > 0 && latestDisbursement[0].dv_number) {
      const lastNumberStr = latestDisbursement[0].dv_number.split('-')[2];
      if (lastNumberStr) {
        const lastNumber = parseInt(lastNumberStr, 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  private isTrackingReferenceConflict(error: Error): boolean {
    return (
      'code' in error &&
      (error as Error & { code: string }).code === '23505' &&
      'detail' in error &&
      typeof (error as Error & { detail?: string }).detail === 'string' &&
      (error as Error & { detail: string }).detail.includes('tracking_reference')
    );
  }

  private isDvNumberConflict(error: Error): boolean {
    return (
      'code' in error &&
      (error as Error & { code: string }).code === '23505' &&
      'detail' in error &&
      typeof (error as Error & { detail?: string }).detail === 'string' &&
      (error as Error & { detail: string }).detail.includes('dv_number')
    );
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

    return `DV-${String(year)}-${month}-${randomChars}`;
  }
}
