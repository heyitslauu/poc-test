import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { ModificationStatus } from '@/database/schemas/modification.schema';

export class ModificationsPaginationQueryDto {
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
    description: 'Search by modification code',
    example: 'MR-202401-00001',
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
    enum: ModificationStatus,
    example: ModificationStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ModificationStatus)
  status?: ModificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by allotment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  allotment_id?: string;

  @ApiPropertyOptional({
    description: 'Sort modifications by date',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortByDate?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Sort modifications by modification code',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortByModificationCode?: 'asc' | 'desc';
}
