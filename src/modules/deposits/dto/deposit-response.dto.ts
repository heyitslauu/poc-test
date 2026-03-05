import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { BankAccountType } from '@/database/schemas/payments.schema';
import { DepositStatus } from '@/database/schemas/deposits.schema';

export class DepositResponseDto {
  @ApiProperty({
    description: 'Deposit ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID associated with the deposit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Fund cluster',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  fund_cluster: FundCluster;

  @ApiProperty({
    description: 'Date of the deposit',
    example: '2024-02-11T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Bank account type',
    enum: BankAccountType,
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
  })
  bank_account_no: BankAccountType;

  @ApiProperty({
    description: 'Deposit number / reference',
    example: 'DEP-2024-001',
  })
  deposit_no: string;

  @ApiProperty({
    description: 'Deposit status',
    enum: DepositStatus,
    example: DepositStatus.DRAFT,
  })
  status: DepositStatus;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Deposit for collection batch',
  })
  remarks?: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-02-11T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-02-11T00:00:00.000Z',
  })
  updated_at: Date;
}
