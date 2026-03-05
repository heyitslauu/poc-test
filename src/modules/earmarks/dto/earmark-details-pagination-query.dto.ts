import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsUUID } from 'class-validator';

export class EarmarkDetailsPaginationQueryDto {
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
    description: 'Filter by allotment details ID',
    example: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
  })
  @IsOptional()
  @IsUUID()
  allotment_details_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'c2ffcd00-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
