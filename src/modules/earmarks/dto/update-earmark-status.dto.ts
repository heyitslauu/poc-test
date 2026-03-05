import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EarmarkStatus } from '../../../database/schemas/earmarks.schema';

export class UpdateEarmarkStatusDto {
  @ApiProperty({
    description: 'New status of the earmark',
    enum: EarmarkStatus,
    example: EarmarkStatus.FOR_TRIAGE,
  })
  @IsEnum(EarmarkStatus)
  status: EarmarkStatus;
}
