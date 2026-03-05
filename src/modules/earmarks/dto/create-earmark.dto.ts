import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNotEmpty, IsEnum } from 'class-validator';
import { EarmarksFundCluster, TransactionType } from '../../../database/schemas/earmarks.schema';

export class CreateEarmarkDto {
  @ApiProperty({
    description: 'Classification of the fund source',
    enum: EarmarksFundCluster,
    example: EarmarksFundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(EarmarksFundCluster)
  @IsNotEmpty()
  fund_cluster: EarmarksFundCluster;

  @ApiPropertyOptional({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.PROCUREMENT_TRANSACTIONS,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Date of the earmark',
    example: '2026-01-30',
  })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'Detailed description of the earmark',
    example: 'Earmark for procurement of office supplies',
  })
  @IsString()
  @IsNotEmpty()
  particulars: string;
}
