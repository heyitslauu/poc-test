import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { FundCluster } from '@/database/schemas/allotments.schema';
import { BankAccountType } from '@/database/schemas/payments.schema';

export class UpdateDepositDto {
  @ApiPropertyOptional({
    description: 'Fund cluster for the deposit',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Date of the deposit (ISO 8601)',
    example: '2024-02-11T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Bank account type',
    enum: BankAccountType,
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
  })
  @IsEnum(BankAccountType)
  @IsOptional()
  bank_account_no?: BankAccountType;

  @ApiPropertyOptional({
    description: 'Deposit number / reference',
    example: 'DEP-2024-001',
  })
  @IsString()
  @IsOptional()
  deposit_no?: string;
}
