import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { truncateAmount } from '@/common/utils/validation.util';

/**
 * Collection linked to a deposit, with display fields for the view.
 * id is the collection id. amount is in pesos.
 */
export class DepositCollectionItemDto {
  @ApiProperty({
    description: 'Collection ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Fund cluster',
    example: 'Fund 101',
  })
  fund_cluster: string;

  @ApiProperty({
    description: 'Collection date (ISO)',
    example: '2026-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'OR number',
    example: 'OR-2026-001234',
  })
  or_number: string;

  @ApiProperty({
    description: 'Payor name',
    example: 'Juan Dela Cruz',
  })
  payor: string;

  @ApiProperty({
    description: 'Collection type code',
    example: 'COL-001',
  })
  collection_type: string;

  @ApiProperty({
    description: 'Particulars',
    example: 'Payment for services',
  })
  particular: string;

  @ApiProperty({
    description: 'Total amount in pesos',
    example: 15000.75,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  amount: number;
}
