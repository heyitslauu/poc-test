import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { BankAccountType } from '@/database/schemas/payments.schema';

export class CreateDepositDto {
  @ApiProperty({
    description: 'Fund cluster for the deposit',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsNotEmpty()
  fund_cluster: FundCluster;

  @ApiProperty({
    description: 'Date of the deposit (ISO 8601)',
    example: '2024-02-11T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Bank account type',
    enum: BankAccountType,
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
  })
  @IsEnum(BankAccountType)
  @IsNotEmpty()
  bank_account_no: BankAccountType;

  @ApiProperty({
    description: 'Deposit number / reference',
    example: 'DEP-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  deposit_no: string;

  @ApiPropertyOptional({
    description: 'Additional remarks for the deposit',
    example: 'Deposit for collection batch',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
