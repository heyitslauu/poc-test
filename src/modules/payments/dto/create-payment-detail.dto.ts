import { IsUUID, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { truncateAmount } from '@/common/utils/validation.util';

export class CreatePaymentDetailDto {
  @ApiProperty({
    description: 'User ID who owns this payment detail',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Payment ID this detail belongs to',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  payment_id: string;

  @ApiProperty({
    description: "Journal entry ID. The payee_id provided must match this journal entry's payee",
    example: '789e0123-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  journal_entry_id: string;

  @ApiProperty({
    description: 'Payee ID. Must match the journal entry payee exactly',
    example: '012e3456-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsNotEmpty()
  payee_id: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit (e.g., cents)',
    example: 15000,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class PaymentDetailResponseDto {
  @ApiProperty({
    description: 'Payment detail ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns this payment detail',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Payment ID this detail belongs to',
    example: '456e7890-e89b-12d3-a456-426614174002',
  })
  payment_id: string;

  @ApiProperty({
    description: 'Journal entry ID',
    example: '789e0123-e89b-12d3-a456-426614174003',
  })
  journal_entry_id: string;

  @ApiProperty({
    description: 'Payee ID',
    example: '012e3456-e89b-12d3-a456-426614174004',
  })
  payee_id: string;

  @ApiProperty({
    description: 'Payment amount in pesos',
    example: 150.0,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  amount: number;

  @ApiProperty({
    description: 'Timestamp when payment detail was created',
    example: '2024-02-05T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when payment detail was last updated',
    example: '2024-02-05T10:30:00.000Z',
  })
  updated_at: Date;
}
