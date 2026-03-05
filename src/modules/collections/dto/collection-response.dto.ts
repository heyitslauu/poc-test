import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { CollectionType, CollectionSpoiledStatus, CollectionStatus } from '@/database/schemas/collections.schema';
import { truncateAmount } from '@/common/utils/validation.util';

export class CollectionResponseDto {
  @ApiProperty({
    description: 'Collection ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID associated with the collection',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  fund_cluster: FundCluster;

  @ApiProperty({
    description: 'Official receipt number',
    example: 'OR-2024-001',
  })
  or_number: string;

  @ApiProperty({
    description: 'Collection date',
    example: '2024-02-11T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Collection status',
    enum: CollectionStatus,
    example: CollectionStatus.DRAFT,
  })
  status: CollectionStatus;

  @ApiProperty({
    description: 'Payor ID (payee UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  payor_id: string;

  @ApiPropertyOptional({
    description: 'Payor/payee name (from join with payees)',
    example: 'ABC Corporation',
  })
  payor_name?: string | null;

  @ApiProperty({
    description: 'Collection type code',
    enum: CollectionType,
    example: CollectionType.COL002,
  })
  collection_type: CollectionType;

  @ApiProperty({
    description: 'Particulars or description',
    example: 'Collection of service income',
  })
  particulars: string;

  @ApiPropertyOptional({
    description: 'Additional remarks for the collection',
    example: 'Collection for Q1 service income',
  })
  remarks?: string;

  @ApiProperty({
    description: 'Whether the OR is spoiled',
    enum: CollectionSpoiledStatus,
    example: CollectionSpoiledStatus.NOT_SPOILED,
  })
  spoiled: CollectionSpoiledStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-02-11T00:00:00.000Z',
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'Linked exFLOW workflow ID',
    example: '72aa994f-c345-469d-92f3-119a1777e016',
  })
  workflow_id?: string | null;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-02-11T00:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Total credit amount from collection details (journal entries), in pesos',
    example: 100.5,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  total_credit: number;
}
