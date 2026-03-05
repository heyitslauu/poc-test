import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { FundCluster } from '../../../database/schemas/allotments.schema';
import { ObligationStatus } from '../../../database/schemas/obligations.schema';
import { truncateAmount } from '@/common/utils/validation.util';
import { PayeeType } from '../../../database/schemas/payees.schema';
import { ObligationDetailResponseDto } from './obligation-detail-response.dto';

class PayeeSummaryDto {
  @ApiProperty({
    description: 'Type of the payee',
    enum: PayeeType,
    example: PayeeType.EMPLOYEE,
  })
  type: PayeeType;

  @ApiPropertyOptional({
    description: 'Name of the payee',
    example: 'Juan Dela Cruz',
    nullable: true,
  })
  name?: string | null;
}

export class ObligationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the obligation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the user who created the obligation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiProperty({
    description: 'UUID of the payee',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  payee_id: string;

  @ApiPropertyOptional({
    description: 'Payee details',
    type: PayeeSummaryDto,
  })
  payee?: PayeeSummaryDto;

  @ApiPropertyOptional({
    description: 'Classification of the fund source',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
    nullable: true,
  })
  fund_cluster: FundCluster | null;

  @ApiPropertyOptional({
    description: 'ORS number for the obligation',
    example: 'ORS-2026-001',
    nullable: true,
  })
  ors_number: string | null;

  @ApiProperty({
    description: 'Unique tracking reference for the obligation',
    example: 'OBL-2026-001',
  })
  tracking_reference: string;

  @ApiProperty({
    description: 'Detailed description of the obligation',
    example: 'Payment for services rendered',
  })
  particulars: string;

  @ApiProperty({
    description: 'Date of the obligation',
    example: '2026-01-30T00:00:00.000Z',
  })
  date: Date;

  @ApiPropertyOptional({
    description: 'Type of transaction',
    example: 'Direct Payment',
    nullable: true,
  })
  transaction_type: string | null;

  @ApiProperty({
    description: 'Monetary amount of the obligation',
    example: 50000.0,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  amount: number;

  @ApiProperty({
    description: 'Current status of the obligation',
    enum: ObligationStatus,
    example: ObligationStatus.DRAFT,
  })
  status: ObligationStatus;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Urgent payment required',
    nullable: true,
  })
  remarks: string | null;

  @ApiProperty({
    description: 'Timestamp when the obligation was created',
    example: '2026-01-30T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the obligation was last updated',
    example: '2026-01-30T10:00:00.000Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'List of obligation details',
    type: [ObligationDetailResponseDto],
  })
  details?: ObligationDetailResponseDto[];
}
