import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@/database/schemas/payments.schema';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Status of the payment',
    enum: PaymentStatus,
    example: PaymentStatus.DRAFT,
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
