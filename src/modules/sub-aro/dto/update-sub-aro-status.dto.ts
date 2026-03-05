import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubAroStatus } from '../../../database/schemas/sub-aro.schema';

export class UpdateSubAroStatusDto {
  @ApiProperty({
    description: 'Status of the sub-aro',
    enum: SubAroStatus,
    example: SubAroStatus.FOR_TRIAGE,
  })
  @IsEnum(SubAroStatus)
  status: SubAroStatus;
}
