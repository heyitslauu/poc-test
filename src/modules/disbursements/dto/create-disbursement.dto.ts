import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { FundCluster } from '../../../database/schemas';

export class CreateDisbursementDto {
  @ApiProperty({
    description: 'Payee ID associated with the disbursement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  payee_id: string;

  @ApiPropertyOptional({
    description: 'Fund cluster (required when status is not DRAFT)',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Particulars or description of the disbursement (required when status is not DRAFT)',
    example: 'Payment for services rendered',
  })
  @IsString()
  @IsOptional()
  particulars?: string;

  @ApiPropertyOptional({
    description: 'Date of the disbursement (required when status is not DRAFT)',
    example: '2026-01-30',
  })
  @IsDateString()
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional({
    description: 'Transaction type (required when status is not DRAFT)',
    example: 'CASH_ADVANCE',
  })
  @IsString()
  @IsOptional()
  transaction_type?: string;

  @ApiPropertyOptional({
    description: 'Amount in centavos (e.g., 100000 = PHP 1,000.00) (required when status is not DRAFT)',
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Urgent payment',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
