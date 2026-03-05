import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { CollectionType, CollectionSpoiledStatus } from '@/database/schemas/collections.schema';

export class UpdateCollectionDto {
  @ApiPropertyOptional({
    description: 'Fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Official receipt number',
    example: 'OR-2024-001',
  })
  @IsString()
  @IsOptional()
  or_number?: string;

  @ApiPropertyOptional({
    description: 'Collection date (ISO 8601)',
    example: '2024-02-11T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Payor ID (payee UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  payor_id?: string;

  @ApiPropertyOptional({
    description: 'Collection type code',
    enum: CollectionType,
    example: CollectionType.COL002,
  })
  @IsEnum(CollectionType)
  @IsOptional()
  collection_type?: CollectionType;

  @ApiPropertyOptional({
    description: 'Particulars or description',
    example: 'Collection of service income',
  })
  @IsString()
  @IsOptional()
  particulars?: string;

  @ApiPropertyOptional({
    description: 'Additional remarks for the collection',
    example: 'Collection for Q1 service income',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Whether the OR is spoiled',
    enum: CollectionSpoiledStatus,
    example: CollectionSpoiledStatus.NOT_SPOILED,
  })
  @IsEnum(CollectionSpoiledStatus)
  @IsOptional()
  spoiled?: CollectionSpoiledStatus;
}
