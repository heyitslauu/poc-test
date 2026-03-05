import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PayeeType } from '@/database/schemas/payees.schema';
import { truncateAmount } from '@/common/utils/validation.util';

export class CollectionDetailResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the collection detail',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the collection',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  collection_id: string;

  @ApiPropertyOptional({
    description: 'UUID of the PAP',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  paps_id?: string | null;

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
    description: 'Type of payee',
    enum: PayeeType,
    example: PayeeType.CREDITOR,
  })
  payee_type: PayeeType;

  @ApiProperty({
    description: 'UUID of the payee',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  payee_id: string;

  @ApiPropertyOptional({
    description: 'Payee display name',
    example: 'ABC Corporation',
  })
  payee_name?: string;

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
    description: 'Timestamp when the collection detail was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the collection detail was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;
}
