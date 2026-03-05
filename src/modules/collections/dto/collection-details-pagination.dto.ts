import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PayeeType } from '@/database/schemas/payees.schema';

export class CollectionDetailsPaginationQueryDto {
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
    description: 'Filter by PAP ID',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  @IsOptional()
  @IsUUID()
  paps_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by payee type',
    enum: PayeeType,
  })
  @IsOptional()
  @IsEnum(PayeeType)
  payee_type?: PayeeType;

  @ApiPropertyOptional({
    description: 'Filter by payee ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  payee_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by UACS ID',
    example: '154eab66-cd6b-4f93-8d3b-32e1ea05fecf',
  })
  @IsOptional()
  @IsUUID()
  uacs_id?: string;
}
