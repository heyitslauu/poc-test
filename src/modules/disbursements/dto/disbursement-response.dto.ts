import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { FundCluster } from '../../../database/schemas';
import { DisbursementStatus } from '../../../database/schemas/disbursements.schema';
import { PayeeType } from '../../../database/schemas/payees.schema';
import { truncateAmount } from '@/common/utils/validation.util';

export class DisbursementResponseDto {
  @ApiProperty({
    description: 'Disbursement unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID who created the disbursement',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  user_id: string;

  @ApiPropertyOptional({
    description: 'Payee information',
    example: { id: '123e4567-e89b-12d3-a456-426614174002', type: 'EMPLOYEE', name: 'John Doe' },
  })
  @Expose()
  payee: {
    id: string;
    type: PayeeType;
    name: string | null;
  } | null;

  @ApiProperty({
    description: 'Fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @Expose()
  fund_cluster: FundCluster;

  @ApiPropertyOptional({
    description: 'DV Number',
    example: 'DV-2026-001',
  })
  @Expose()
  dv_number: string | null;

  @ApiProperty({
    description: 'Tracking reference',
    example: 'DV-2026-01-ABC12345',
  })
  @Expose()
  tracking_reference: string;

  @ApiProperty({
    description: 'Particulars or description of the disbursement',
    example: 'Payment for services rendered',
  })
  @Expose()
  particulars: string;

  @ApiProperty({
    description: 'Date of the disbursement',
    example: '2026-01-30T00:00:00.000Z',
  })
  @Expose()
  date: Date;

  @ApiProperty({
    description: 'Transaction type',
    example: 'CASH_ADVANCE',
  })
  @Expose()
  transaction_type: string;

  @ApiProperty({
    description: 'Monetary amount of the disbursement',
    example: 1000.0,
  })
  @Expose()
  @Transform(({ value }) => (value !== null ? truncateAmount(value / 100, 2) : null))
  amount: number | null;

  @ApiProperty({
    description: 'Disbursement status',
    enum: DisbursementStatus,
    example: DisbursementStatus.DRAFT,
  })
  @Expose()
  status: DisbursementStatus;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Urgent payment',
  })
  @Expose()
  remarks: string | null;

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
