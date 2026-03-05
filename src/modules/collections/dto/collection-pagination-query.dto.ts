import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString, IsEnum, IsIn, IsBoolean, IsUUID } from 'class-validator';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { CollectionStatus, CollectionType, CollectionSpoiledStatus } from '@/database/schemas/collections.schema';

export class CollectionPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by OR number or particulars',
    example: 'OR-2024-001',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter by date. Single date (YYYY-MM-DD) for one day, or date range separated by comma (YYYY-MM-DD,YYYY-MM-DD)',
    example: '2024-02-11 or 2024-02-01,2024-02-28',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: CollectionStatus,
    example: CollectionStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CollectionStatus)
  status?: CollectionStatus;

  @ApiPropertyOptional({
    description: 'Filter by fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsOptional()
  @IsEnum(FundCluster)
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Filter by collection type',
    enum: CollectionType,
    example: CollectionType.COL002,
  })
  @IsOptional()
  @IsEnum(CollectionType)
  collection_type?: CollectionType;

  @ApiPropertyOptional({
    description: 'Filter by payor ID (payee UUID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  payor_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by spoiled status',
    enum: CollectionSpoiledStatus,
    example: CollectionSpoiledStatus.NOT_SPOILED,
  })
  @IsOptional()
  @IsEnum(CollectionSpoiledStatus)
  spoiled?: CollectionSpoiledStatus;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Sort by date',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortByDate?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Sort by OR number',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortByOrNumber?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'When true, only return collections that are not linked to any deposit',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unlinkedToDeposit?: boolean;
}
