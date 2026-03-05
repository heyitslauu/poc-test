import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EarmarkStatus, EarmarksFundCluster, TransactionType } from '../../../database/schemas/earmarks.schema';
import { EarmarkDetailResponseDto } from './earmark-detail-response.dto';

export class EarmarkResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the earmark',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the user who created the earmark',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: 'Unique earmark code assigned upon approval',
    example: '01-2026-0001',
    nullable: true,
  })
  earmark_code: string;

  @ApiPropertyOptional({
    description: 'Classification of the fund source',
    enum: EarmarksFundCluster,
    example: EarmarksFundCluster.REGULAR_AGENCY_FUND,
    nullable: true,
  })
  fund_cluster: EarmarksFundCluster;

  @ApiPropertyOptional({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.PROCUREMENT_TRANSACTIONS,
    nullable: true,
  })
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Date of the earmark',
    example: '2026-01-30T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Detailed description of the earmark',
    example: 'Earmark for procurement of office supplies',
  })
  particulars: string;

  @ApiProperty({
    description: 'Current status of the earmark',
    enum: EarmarkStatus,
    example: EarmarkStatus.FOR_PROCESSING,
  })
  status: EarmarkStatus;

  @ApiProperty({
    description: 'Timestamp when the earmark was created',
    example: '2026-01-30T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the earmark was last updated',
    example: '2026-01-30T00:00:00.000Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'List of earmark details',
    type: [EarmarkDetailResponseDto],
  })
  details?: EarmarkDetailResponseDto[];
}
