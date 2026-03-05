import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { TransactionType } from '../../../database/schemas/earmarks.schema';

export class UpdateEarmarkDto {
  @ApiPropertyOptional({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.PROCUREMENT_TRANSACTIONS,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  transaction_type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Date of the earmark',
    example: '2026-01-30',
  })
  @IsDateString()
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional({
    description: 'Detailed description of the earmark',
    example: 'Earmark for procurement of office supplies',
  })
  @IsString()
  @IsOptional()
  particulars?: string;
}
