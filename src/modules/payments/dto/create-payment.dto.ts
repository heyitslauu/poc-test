import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { PaymentType, PaymentStatus, SpoilCheckStatus, BankAccountType } from '@/database/schemas/payments.schema';
import { FundCluster } from '@/database/schemas/allotments.schema';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Fund cluster for the payment',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsNotEmpty()
  fund_cluster: FundCluster;

  @ApiProperty({
    description: 'Bank account type',
    enum: BankAccountType,
    example: BankAccountType.REGULAR_AGENCY_LBP_MDS,
  })
  @IsEnum(BankAccountType)
  @IsNotEmpty()
  bank_account_no: BankAccountType;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.DRAFT,
  })
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.CHECK,
  })
  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'PAY-2023-001',
  })
  @IsString()
  @IsOptional()
  payment_reference_no?: string;

  @ApiProperty({
    description: 'Spoil check status',
    enum: SpoilCheckStatus,
    example: SpoilCheckStatus.NOT_SPOILED,
  })
  @IsEnum(SpoilCheckStatus)
  @IsNotEmpty()
  spoil_check_status: SpoilCheckStatus;

  @ApiPropertyOptional({
    description: 'Additional remarks for the payment',
    example: 'Payment for office supplies',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
