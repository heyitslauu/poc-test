import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { ObligationStatus } from '../../../database/schemas/obligations.schema';
import { FundCluster } from '../../../database/schemas/allotments.schema';

export class ObligationsPaginationQueryDto {
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
    description: 'Search by ORS number, tracking reference, or particulars',
    example: 'EX-202601-ABC123',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter by date. Single date (YYYY-MM-DD) for one day, or date range separated by comma (YYYY-MM-DD,YYYY-MM-DD)',
    example: '2026-01-01 or 2026-01-01,2026-02-02',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ObligationStatus,
    example: ObligationStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ObligationStatus)
  status?: ObligationStatus;

  @ApiPropertyOptional({
    description: 'Filter by fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsOptional()
  @IsEnum(FundCluster)
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    example: 'Direct Payment',
  })
  @IsOptional()
  @IsString()
  transaction_type?: string;

  @ApiPropertyOptional({
    description: 'Sort obligations by date',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortByDate?: 'asc' | 'desc';
}
