import { ApiProperty } from '@nestjs/swagger';
import { WithdrawalStatus } from '../../../database/schemas/withdrawals.schema';
import { WithdrawalDetailResponseDto } from './withdrawal-detail-response.dto';

export class WithdrawalResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the withdrawal',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Unique request ID in format WD-YYYYMM-XXXXX',
    example: 'WD-202601-00001',
  })
  withdrawal_code: string;

  @ApiProperty({
    description: 'User ID who created the withdrawal',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiProperty({
    description: 'UUID of the sub ARO being withdrawn from',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  sub_aro_id: string;

  @ApiProperty({
    description: 'Date of the withdrawal',
    example: '2026-01-23T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Details of the withdrawal',
    example: 'Withdraw funds for project X',
  })
  particulars: string;

  @ApiProperty({
    description: 'Status of the withdrawal',
    enum: WithdrawalStatus,
    example: WithdrawalStatus.DRAFT,
  })
  status: WithdrawalStatus;

  @ApiProperty({
    description: 'Timestamp when the withdrawal was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the withdrawal was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Array of withdrawal details',
    type: [WithdrawalDetailResponseDto],
    required: false,
  })
  details?: WithdrawalDetailResponseDto[];
}
