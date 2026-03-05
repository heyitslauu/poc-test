import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ObligationStatus } from '../../../database/schemas/obligations.schema';

export class UpdateObligationStatusDto {
  @ApiProperty({
    description: 'Status of the obligation',
    enum: ObligationStatus,
    example: ObligationStatus.FOR_TRIAGE,
  })
  @IsEnum(ObligationStatus)
  status: ObligationStatus;
}
