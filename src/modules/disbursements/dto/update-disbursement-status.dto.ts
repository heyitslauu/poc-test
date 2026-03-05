import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DisbursementStatus } from '../../../database/schemas/disbursements.schema';

export class UpdateDisbursementStatusDto {
  @ApiProperty({
    description: 'Status of the disbursement',
    enum: DisbursementStatus,
    example: DisbursementStatus.FOR_PROCESSING,
  })
  @IsEnum(DisbursementStatus)
  status: DisbursementStatus;
}
