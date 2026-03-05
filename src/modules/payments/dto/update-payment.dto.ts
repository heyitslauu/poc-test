import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { PaymentType, PaymentStatus, SpoilCheckStatus, BankAccountType } from '@/database/schemas/payments.schema';
import { FundCluster } from '@/database/schemas/allotments.schema';

export class UpdatePaymentDto {
  @ApiPropertyOptional({
    description: 'User ID associated with the payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Fund cluster for the payment',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @ApiPropertyOptional({
    description: 'Bank account type',
    enum: BankAccountType,
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
  })
  @IsEnum(BankAccountType)
  @IsOptional()
  bank_account_no?: BankAccountType;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.DRAFT,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.CHECK,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  type?: PaymentType;

  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'PAY-2023-001',
  })
  @IsString()
  @IsOptional()
  payment_reference_no?: string;

  @ApiPropertyOptional({
    description: 'Spoil check status',
    enum: SpoilCheckStatus,
    example: SpoilCheckStatus.NOT_SPOILED,
  })
  @IsEnum(SpoilCheckStatus)
  @IsOptional()
  spoil_check_status?: SpoilCheckStatus;

  @ApiPropertyOptional({
    description: 'Additional remarks for the payment',
    example: 'Payment for office supplies',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
