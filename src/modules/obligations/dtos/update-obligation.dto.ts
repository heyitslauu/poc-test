import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString, Min, IsUUID, IsEnum } from 'class-validator';
import { FundCluster } from '../../../database/schemas/allotments.schema';

export class UpdateObligationDto {
  @ApiPropertyOptional({
    description: 'UUID of the payee',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsOptional()
  payee_id?: string;

  @ApiPropertyOptional({
    description: 'Classification of the fund source',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Detailed description of the obligation',
    example: 'Payment for services rendered',
  })
  @IsString()
  @IsOptional()
  particulars?: string;

  @ApiPropertyOptional({
    description: 'Date of the obligation',
    example: '2026-01-30',
  })
  @IsDateString()
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional({
    description: 'Type of transaction',
    example: 'Direct Payment',
  })
  @IsString()
  @IsOptional()
  transaction_type?: string;

  @ApiPropertyOptional({
    description: 'Monetary amount of the obligation',
    minimum: 0,
    example: 50000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must have at most 2 decimal places' })
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Urgent payment required',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
