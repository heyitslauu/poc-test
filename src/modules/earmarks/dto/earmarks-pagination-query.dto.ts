import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { EarmarkStatus, EarmarksFundCluster, TransactionType } from '../../../database/schemas/earmarks.schema';

export class EarmarksPaginationQueryDto {
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
    description: 'Search by earmark code or particulars',
    example: 'procurement',
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
    enum: EarmarkStatus,
    example: EarmarkStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(EarmarkStatus)
  status?: EarmarkStatus;

  @ApiPropertyOptional({
    description: 'Filter by fund cluster',
    enum: EarmarksFundCluster,
    example: EarmarksFundCluster.REGULAR_AGENCY_FUND,
  })
  @IsOptional()
  @IsEnum(EarmarksFundCluster)
  fund_cluster?: EarmarksFundCluster;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionType,
    example: TransactionType.PROCUREMENT_TRANSACTIONS,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transaction_type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Sort earmarks by date',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortByDate?: 'asc' | 'desc';
}
