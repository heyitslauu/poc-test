import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum, IsIn } from 'class-validator';

export class SubAroPaginationQueryDto {
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
    description: 'Search by sub-aro code, office name, or particulars',
    example: 'SAR-202601-00001',
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
    enum: ['DRAFT', 'FOR_TRIAGE', 'FOR_PROCESSING', 'FOR_PEER_REVIEW', 'FOR_APPROVAL', 'APPROVED', 'REJECTED'],
    example: 'DRAFT',
  })
  @IsOptional()
  @IsIn(['DRAFT', 'FOR_TRIAGE', 'FOR_PROCESSING', 'FOR_PEER_REVIEW', 'FOR_APPROVAL', 'APPROVED', 'REJECTED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Sort sub-aros by date',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortByDate?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Sort sub-aros by sub-aro code',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortByCode?: 'asc' | 'desc';
}
