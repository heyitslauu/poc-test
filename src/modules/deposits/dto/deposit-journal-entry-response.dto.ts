import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { truncateAmount } from '@/common/utils/validation.util';

export class DepositJournalEntryResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the deposit journal entry',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the deposit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  deposit_id: string;

  @ApiPropertyOptional({
    description: 'UUID of the PAP (Program, Activity, and Project)',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  paps_id?: string;

  @ApiPropertyOptional({
    description: 'PAP code',
    example: 'PAP001',
  })
  pap_code?: string;

  @ApiPropertyOptional({
    description: 'PAP name',
    example: 'Program Name',
  })
  pap_name?: string;

  @ApiProperty({
    description: 'UUID of the UACS (Revised Chart of Accounts)',
    example: '154eab66-cd6b-4f93-8d3b-32e1ea05fecf',
  })
  uacs_id: string;

  @ApiPropertyOptional({
    description: 'UACS code',
    example: '1-01-01',
  })
  uacs_code?: string;

  @ApiPropertyOptional({
    description: 'UACS name',
    example: 'Cash',
  })
  uacs_name?: string;

  @ApiProperty({
    description: 'Debit amount in pesos',
    example: 10000.5,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  debit: number;

  @ApiProperty({
    description: 'Credit amount in pesos',
    example: 0,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  credit: number;

  @ApiProperty({
    description: 'Timestamp when the deposit journal entry was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the deposit journal entry was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;
}
