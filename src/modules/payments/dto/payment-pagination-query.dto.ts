import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator';
import { PaymentType, PaymentStatus, SpoilCheckStatus, BankAccountType } from '@/database/schemas/payments.schema';
import { FundCluster } from '@/database/schemas/allotments.schema';

export class PaymentPaginationQueryDto {
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
    description: 'Search term for payment reference number or remarks',
    example: 'search term',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment type',
    example: PaymentType.CHECK,
    enum: PaymentType,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    example: PaymentStatus.DRAFT,
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by spoil check status',
    example: SpoilCheckStatus.NOT_SPOILED,
    enum: SpoilCheckStatus,
  })
  @IsOptional()
  @IsEnum(SpoilCheckStatus)
  spoil_check_status?: SpoilCheckStatus;

  @ApiPropertyOptional({
    description: 'Filter by fund cluster',
    example: FundCluster.REGULAR_AGENCY_FUND,
    enum: FundCluster,
  })
  @IsOptional()
  @IsEnum(FundCluster)
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Filter by bank account type',
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
    enum: BankAccountType,
  })
  @IsOptional()
  @IsEnum(BankAccountType)
  bank_account_no?: BankAccountType;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  user_id?: string;
}
