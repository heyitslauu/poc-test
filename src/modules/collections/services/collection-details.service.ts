import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, desc, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { CreateCollectionDetailDto } from '../dto/create-collection-detail.dto';
import { UpdateCollectionDetailDto } from '../dto/update-collection-detail.dto';
import { CollectionDetailResponseDto } from '../dto/collection-detail-response.dto';
import { CollectionDetailsPaginationQueryDto } from '../dto/collection-details-pagination.dto';
import { DATABASE_CONNECTION } from '@/config/database.config';
import * as schema from '@/database/schemas';
import { collectionDetails, NewCollectionDetail } from '@/database/schemas/collection-details.schema';

@Injectable()
export class CollectionDetailsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: string,
    createCollectionDetailDto: CreateCollectionDetailDto,
  ): Promise<CollectionDetailResponseDto> {
    if (createCollectionDetailDto.debit === 0 && createCollectionDetailDto.credit === 0) {
      throw new BadRequestException('At least one of debit or credit must be greater than 0');
    }

    const createdId = await this.db.transaction(async (tx) => {
      const collectionResult = await tx
        .select()
        .from(schema.collections)
        .where(eq(schema.collections.id, createCollectionDetailDto.collection_id));

      if (collectionResult.length === 0) {
        throw new NotFoundException(`Collection with ID ${createCollectionDetailDto.collection_id} not found`);
      }

      if (createCollectionDetailDto.paps_id) {
        const papsResult = await tx
          .select()
          .from(schema.paps)
          .where(eq(schema.paps.id, createCollectionDetailDto.paps_id));
        if (papsResult.length === 0) {
          throw new NotFoundException(`PAP with ID ${createCollectionDetailDto.paps_id} not found`);
        }
      }

      const payeeResult = await tx
        .select()
        .from(schema.payees)
        .where(eq(schema.payees.id, createCollectionDetailDto.payee_id));

      if (payeeResult.length === 0) {
        throw new NotFoundException(`Payee with ID ${createCollectionDetailDto.payee_id} not found`);
      }

      if (payeeResult[0].type !== createCollectionDetailDto.payee_type) {
        throw new BadRequestException(
          `Payee type must match payee. Expected ${payeeResult[0].type}, got ${createCollectionDetailDto.payee_type}`,
        );
      }

      const uacsResult = await tx
        .select()
        .from(schema.revisedChartOfAccounts)
        .where(eq(schema.revisedChartOfAccounts.id, createCollectionDetailDto.uacs_id));

      if (uacsResult.length === 0) {
        throw new NotFoundException(
          `UACS (Revised Chart of Accounts) with ID ${createCollectionDetailDto.uacs_id} not found`,
        );
      }

      const [collectionDetail] = await tx
        .insert(collectionDetails)
        .values({
          collection_id: createCollectionDetailDto.collection_id,
          user_id: userId,
          paps_id: createCollectionDetailDto.paps_id ?? null,
          payee_type: createCollectionDetailDto.payee_type,
          payee_id: createCollectionDetailDto.payee_id,
          uacs_id: createCollectionDetailDto.uacs_id,
          debit: Math.round(createCollectionDetailDto.debit * 100),
          credit: Math.round(createCollectionDetailDto.credit * 100),
        } as NewCollectionDetail)
        .returning();

      return collectionDetail.id;
    });

    return await this.findOne(createdId);
  }

  async findAll(
    collectionId: string,
    paginationQuery: CollectionDetailsPaginationQueryDto,
  ): Promise<{ data: CollectionDetailResponseDto[]; totalItems: number }> {
    const { page = 1, limit = 10, paps_id, payee_type, payee_id, uacs_id } = paginationQuery;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(collectionDetails.collection_id, collectionId)];
    if (paps_id) conditions.push(eq(collectionDetails.paps_id, paps_id));
    if (payee_type) conditions.push(eq(collectionDetails.payee_type, payee_type));
    if (payee_id) conditions.push(eq(collectionDetails.payee_id, payee_id));
    if (uacs_id) conditions.push(eq(collectionDetails.uacs_id, uacs_id));

    const whereConditions = and(...conditions);

    const [detailsData, [{ value: totalItems }]] = await Promise.all([
      this.db
        .select({
          id: collectionDetails.id,
          collection_id: collectionDetails.collection_id,
          paps_id: collectionDetails.paps_id,
          payee_type: collectionDetails.payee_type,
          payee_id: collectionDetails.payee_id,
          uacs_id: collectionDetails.uacs_id,
          debit: collectionDetails.debit,
          credit: collectionDetails.credit,
          created_at: collectionDetails.created_at,
          updated_at: collectionDetails.updated_at,
          pap_name: schema.paps.name,
          pap_code: schema.paps.code,
          payee_name: schema.payees.name,
          uacs_name: schema.revisedChartOfAccounts.name,
          uacs_code: schema.revisedChartOfAccounts.code,
        })
        .from(collectionDetails)
        .leftJoin(schema.paps, eq(collectionDetails.paps_id, schema.paps.id))
        .leftJoin(schema.payees, eq(collectionDetails.payee_id, schema.payees.id))
        .leftJoin(schema.revisedChartOfAccounts, eq(collectionDetails.uacs_id, schema.revisedChartOfAccounts.id))
        .where(whereConditions)
        .orderBy(desc(collectionDetails.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(collectionDetails).where(whereConditions),
    ]);

    const data = detailsData.map((row) => {
      const dto = plainToInstance(CollectionDetailResponseDto, {
        id: row.id,
        collection_id: row.collection_id,
        paps_id: row.paps_id,
        payee_type: row.payee_type,
        payee_id: row.payee_id,
        uacs_id: row.uacs_id,
        debit: row.debit,
        credit: row.credit,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      dto.pap_code = row.pap_code ?? undefined;
      dto.pap_name = row.pap_name ?? undefined;
      dto.payee_name = row.payee_name ?? undefined;
      dto.uacs_code = row.uacs_code ?? undefined;
      dto.uacs_name = row.uacs_name ?? undefined;
      return dto;
    });
    return { data, totalItems };
  }

  async findOne(id: string): Promise<CollectionDetailResponseDto> {
    const result = await this.db
      .select({
        id: collectionDetails.id,
        collection_id: collectionDetails.collection_id,
        paps_id: collectionDetails.paps_id,
        payee_type: collectionDetails.payee_type,
        payee_id: collectionDetails.payee_id,
        uacs_id: collectionDetails.uacs_id,
        debit: collectionDetails.debit,
        credit: collectionDetails.credit,
        created_at: collectionDetails.created_at,
        updated_at: collectionDetails.updated_at,
        pap_name: schema.paps.name,
        pap_code: schema.paps.code,
        payee_name: schema.payees.name,
        uacs_name: schema.revisedChartOfAccounts.name,
        uacs_code: schema.revisedChartOfAccounts.code,
      })
      .from(collectionDetails)
      .leftJoin(schema.paps, eq(collectionDetails.paps_id, schema.paps.id))
      .leftJoin(schema.payees, eq(collectionDetails.payee_id, schema.payees.id))
      .leftJoin(schema.revisedChartOfAccounts, eq(collectionDetails.uacs_id, schema.revisedChartOfAccounts.id))
      .where(eq(collectionDetails.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Collection detail with ID ${id} not found`);
    }

    const row = result[0];
    const dto = plainToInstance(CollectionDetailResponseDto, {
      id: row.id,
      collection_id: row.collection_id,
      paps_id: row.paps_id,
      payee_type: row.payee_type,
      payee_id: row.payee_id,
      uacs_id: row.uacs_id,
      debit: row.debit,
      credit: row.credit,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
    dto.pap_code = row.pap_code ?? undefined;
    dto.pap_name = row.pap_name ?? undefined;
    dto.payee_name = row.payee_name ?? undefined;
    dto.uacs_code = row.uacs_code ?? undefined;
    dto.uacs_name = row.uacs_name ?? undefined;
    return dto;
  }

  async update(id: string, updateCollectionDetailDto: UpdateCollectionDetailDto): Promise<CollectionDetailResponseDto> {
    await this.db.transaction(async (tx) => {
      const existingDetail = await tx.select().from(collectionDetails).where(eq(collectionDetails.id, id)).limit(1);

      if (existingDetail.length === 0) {
        throw new NotFoundException(`Collection detail with ID ${id} not found`);
      }

      const updateData: Partial<NewCollectionDetail> = {};

      if (updateCollectionDetailDto.paps_id !== undefined) {
        if (updateCollectionDetailDto.paps_id === null || updateCollectionDetailDto.paps_id === '') {
          updateData.paps_id = null;
        } else {
          const papsResult = await tx
            .select()
            .from(schema.paps)
            .where(eq(schema.paps.id, updateCollectionDetailDto.paps_id));
          if (papsResult.length === 0) {
            throw new NotFoundException(`PAP with ID ${updateCollectionDetailDto.paps_id} not found`);
          }
          updateData.paps_id = updateCollectionDetailDto.paps_id;
        }
      }

      if (updateCollectionDetailDto.payee_id !== undefined) {
        const payeeResult = await tx
          .select()
          .from(schema.payees)
          .where(eq(schema.payees.id, updateCollectionDetailDto.payee_id));
        if (payeeResult.length === 0) {
          throw new NotFoundException(`Payee with ID ${updateCollectionDetailDto.payee_id} not found`);
        }
        const payeeType = updateCollectionDetailDto.payee_type ?? existingDetail[0].payee_type;
        if (payeeResult[0].type !== payeeType) {
          throw new BadRequestException(
            `Payee type must match payee. Expected ${payeeResult[0].type}, got ${payeeType}`,
          );
        }
        updateData.payee_id = updateCollectionDetailDto.payee_id;
      }

      if (updateCollectionDetailDto.payee_type !== undefined) {
        updateData.payee_type = updateCollectionDetailDto.payee_type;
        if (updateCollectionDetailDto.payee_id === undefined) {
          const payeeResult = await tx
            .select()
            .from(schema.payees)
            .where(eq(schema.payees.id, existingDetail[0].payee_id));
          if (payeeResult.length > 0 && payeeResult[0].type !== updateCollectionDetailDto.payee_type) {
            throw new BadRequestException(
              `Payee type must match payee. Expected ${payeeResult[0].type}, got ${updateCollectionDetailDto.payee_type}`,
            );
          }
        }
      }

      if (updateCollectionDetailDto.uacs_id !== undefined) {
        const uacsResult = await tx
          .select()
          .from(schema.revisedChartOfAccounts)
          .where(eq(schema.revisedChartOfAccounts.id, updateCollectionDetailDto.uacs_id));
        if (uacsResult.length === 0) {
          throw new NotFoundException(`UACS with ID ${updateCollectionDetailDto.uacs_id} not found`);
        }
        updateData.uacs_id = updateCollectionDetailDto.uacs_id;
      }

      if (updateCollectionDetailDto.debit !== undefined || updateCollectionDetailDto.credit !== undefined) {
        const newDebit =
          updateCollectionDetailDto.debit !== undefined
            ? Math.round(updateCollectionDetailDto.debit * 100)
            : existingDetail[0].debit;
        const newCredit =
          updateCollectionDetailDto.credit !== undefined
            ? Math.round(updateCollectionDetailDto.credit * 100)
            : existingDetail[0].credit;

        if (newDebit === 0 && newCredit === 0) {
          throw new BadRequestException('At least one of debit or credit must be greater than 0');
        }
        updateData.debit = newDebit;
        updateData.credit = newCredit;
      }

      await tx.update(collectionDetails).set(updateData).where(eq(collectionDetails.id, id));
    });

    return await this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const existingDetail = await tx.select().from(collectionDetails).where(eq(collectionDetails.id, id)).limit(1);

      if (existingDetail.length === 0) {
        throw new NotFoundException(`Collection detail with ID ${id} not found`);
      }

      await tx.delete(collectionDetails).where(eq(collectionDetails.id, id));
    });
  }
}
