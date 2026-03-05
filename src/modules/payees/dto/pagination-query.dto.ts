import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { PayeeType } from '../../../database/schemas/payees.schema';

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
    description: 'Search term for name, TIN, or type',
    example: 'search term',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by payee type',
    example: PayeeType.EMPLOYEE,
    enum: PayeeType,
  })
  @IsOptional()
  @IsEnum(PayeeType)
  type?: PayeeType;

  @ApiPropertyOptional({
    description: 'Filter by Tax Identification Number',
    example: '123-456-789-000',
  })
  @IsOptional()
  @IsString()
  tin_no?: string;

  @ApiPropertyOptional({
    description: 'Filter by Bank Account Number',
    example: '001234567890',
  })
  @IsOptional()
  @IsString()
  bank_account_no?: string;
}
