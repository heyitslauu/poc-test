import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsEnum, IsString } from 'class-validator';
import { FundCluster, AppropriationType, BfarsBudgetType, AllotmentType } from '../../../database/schemas';

export class DraftPaginationQueryDto {
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

  @ApiPropertyOptional({
    description: 'Filter by date or date range (comma-separated: "2025-01-01" or "2025-01-01,2025-01-31")',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by fund cluster', enum: FundCluster })
  @IsOptional()
  @IsEnum(FundCluster)
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({ description: 'Filter by appropriation type', enum: AppropriationType })
  @IsOptional()
  @IsEnum(AppropriationType)
  appropriation_type?: AppropriationType;

  @ApiPropertyOptional({ description: 'Filter by BFARs budget type', enum: BfarsBudgetType })
  @IsOptional()
  @IsEnum(BfarsBudgetType)
  bfars_budget_type?: BfarsBudgetType;

  @ApiPropertyOptional({ description: 'Filter by allotment type', enum: AllotmentType })
  @IsOptional()
  @IsEnum(AllotmentType)
  allotment_type?: AllotmentType;
}
