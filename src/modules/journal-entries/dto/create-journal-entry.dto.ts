import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryType } from '../../../database/schemas/journal-entries.schema';

export class CreateJournalEntryDto {
  @ApiProperty({
    description: 'Payee ID associated with the journal entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  payee_id: string;

  @ApiProperty({
    description: 'Disbursement ID associated with the journal entry',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  disbursement_id: string;

  @ApiProperty({
    description: 'Obligation detail ID associated with the journal entry',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsNotEmpty()
  @IsString()
  obligation_detail_id: string;

  @ApiProperty({
    description: 'Revised Chart of Accounts ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsNotEmpty()
  @IsString()
  rca_id: string;

  @ApiPropertyOptional({
    description: 'RCA Sub-Object ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @IsString()
  @IsOptional()
  rca_sub_object_id?: string;

  @ApiProperty({
    description: 'Entry type (DEBIT or CREDIT)',
    enum: JournalEntryType,
    example: JournalEntryType.DEBIT,
  })
  @IsEnum(JournalEntryType)
  @IsNotEmpty()
  entry_type: JournalEntryType;

  @ApiProperty({
    description: 'Amount in centavos (e.g., 100000 = PHP 1,000.00)',
    example: 100000,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class CreateJournalEntriesBatchDto {
  @ApiProperty({
    description: 'Array of journal entries (minimum 2 required for balanced double-entry)',
    type: [CreateJournalEntryDto],
    example: [
      {
        payee_id: '123e4567-e89b-12d3-a456-426614174000',
        disbursement_id: '123e4567-e89b-12d3-a456-426614174001',
        obligation_detail_id: '123e4567-e89b-12d3-a456-426614174002',
        rca_id: '123e4567-e89b-12d3-a456-426614174003',
        entry_type: 'DEBIT',
        amount: 100000,
      },
      {
        payee_id: '123e4567-e89b-12d3-a456-426614174000',
        disbursement_id: '123e4567-e89b-12d3-a456-426614174001',
        obligation_detail_id: '123e4567-e89b-12d3-a456-426614174002',
        rca_id: '123e4567-e89b-12d3-a456-426614174004',
        entry_type: 'CREDIT',
        amount: 100000,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 journal entries are required for double-entry bookkeeping' })
  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryDto)
  entries: CreateJournalEntryDto[];
}
