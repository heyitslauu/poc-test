import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { CollectionType, CollectionSpoiledStatus } from '@/database/schemas/collections.schema';

export class CreateCollectionDto {
  @ApiProperty({
    description: 'Fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsNotEmpty()
  fund_cluster: FundCluster;

  @ApiProperty({
    description: 'Official receipt number',
    example: 'OR-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  or_number: string;

  @ApiProperty({
    description: 'Collection date (ISO 8601)',
    example: '2024-02-11T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Payor ID (payee UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  payor_id: string;

  @ApiProperty({
    description: 'Collection type code',
    enum: CollectionType,
    example: CollectionType.COL002,
  })
  @IsEnum(CollectionType)
  @IsNotEmpty()
  collection_type: CollectionType;

  @ApiProperty({
    description: 'Particulars or description',
    example: 'Collection of service income',
  })
  @IsString()
  @IsNotEmpty()
  particulars: string;

  @ApiPropertyOptional({
    description: 'Additional remarks for the collection',
    example: 'Collection for Q1 service income',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    description: 'Whether the OR is spoiled',
    enum: CollectionSpoiledStatus,
    example: CollectionSpoiledStatus.NOT_SPOILED,
  })
  @IsEnum(CollectionSpoiledStatus)
  @IsNotEmpty()
  spoiled: CollectionSpoiledStatus;
}
