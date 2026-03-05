import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, PaymentStatus, SpoilCheckStatus, BankAccountType } from '@/database/schemas/payments.schema';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID associated with the payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Fund cluster for the payment',
    example: 'GENERAL FUND',
  })
  fund_cluster: string;

  @ApiProperty({
    description: 'Bank account type',
    enum: BankAccountType,
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
  })
  bank_account_no: BankAccountType;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.DRAFT,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.CHECK,
  })
  type: PaymentType;

  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'PAY-2023-001',
  })
  payment_reference_no?: string;

  @ApiProperty({
    description: 'Spoil check status',
    enum: SpoilCheckStatus,
    example: SpoilCheckStatus.NOT_SPOILED,
  })
  spoil_check_status: SpoilCheckStatus;

  @ApiPropertyOptional({
    description: 'Additional remarks for the payment',
    example: 'Payment for office supplies',
  })
  remarks?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}
