import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WithdrawalStatus } from '../../../database/schemas/withdrawals.schema';

export class UpdateWithdrawalStatusDto {
  @ApiProperty({
    description: 'Status of the withdrawal',
    enum: WithdrawalStatus,
    example: WithdrawalStatus.FOR_TRIAGE,
  })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;
}
