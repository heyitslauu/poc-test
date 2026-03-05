import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { JournalEntryType } from '../../../database/schemas/journal-entries.schema';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { PayeeResponseDto } from '../../payees/dto/payee-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import { SubObjectResponseDto } from '../../rca/dto/sub-object-response.dto';

export class JournalEntryResponseDto {
  @ApiProperty({
    description: 'Journal entry unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID who created the journal entry',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  user_id: string;

  @ApiProperty({
    description: 'Payee ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  payee_id: string;

  @ApiPropertyOptional({
    description: 'Payee details',
    type: PayeeResponseDto,
  })
  @Expose()
  payee?: PayeeResponseDto;

  @ApiProperty({
    description: 'Disbursement ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Expose()
  disbursement_id: string;

  @ApiProperty({
    description: 'Obligation detail ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @Expose()
  obligation_detail_id: string;

  @ApiProperty({
    description: 'Revised Chart of Accounts ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @Expose()
  rca_id: string;

  @ApiPropertyOptional({
    description: 'RCA details',
    type: RcaResponseDto,
  })
  @Expose()
  rca?: RcaResponseDto;

  @ApiPropertyOptional({
    description: 'RCA Sub-Object ID',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  @Expose()
  rca_sub_object_id: string | null;

  @ApiPropertyOptional({
    description: 'RCA Sub-Object details',
    type: SubObjectResponseDto,
  })
  @Expose()
  rca_sub_object?: SubObjectResponseDto;

  @ApiPropertyOptional({
    description: 'PAP details',
    type: PapResponseDto,
  })
  @Expose()
  pap?: PapResponseDto;

  @ApiProperty({
    description: 'Entry type (DEBIT or CREDIT)',
    enum: JournalEntryType,
    example: JournalEntryType.DEBIT,
  })
  @Expose()
  entry_type: JournalEntryType;

  @ApiProperty({
    description: 'Monetary amount',
    example: 1000.0,
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2026-01-30T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2026-01-30T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;
}
