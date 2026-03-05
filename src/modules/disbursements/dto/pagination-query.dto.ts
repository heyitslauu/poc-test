import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { FundCluster } from '../../../database/schemas/allotments.schema';
import { DisbursementStatus } from '../../../database/schemas/disbursements.schema';

export class PaginationQueryDto {
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
    description: 'Search term',
    example: 'search term',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by fund cluster', enum: FundCluster })
  @IsOptional()
  @IsEnum(FundCluster)
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus)
  status?: DisbursementStatus;

  @ApiPropertyOptional({
    description: 'Sort disbursements by created date in ascending or descending order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortByDate?: 'asc' | 'desc';
  @ApiPropertyOptional({
    description: 'Start date for disbursement date filter (inclusive)',
    type: 'string',
    format: 'date',
    example: '2026-02-01',
    required: false,
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for disbursement date filter (inclusive)',
    type: 'string',
    format: 'date',
    example: '2026-02-28',
    required: false,
  })
  @IsOptional()
  endDate?: string;
}
