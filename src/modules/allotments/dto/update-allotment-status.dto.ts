import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AllotmentStatus } from '../../../database/schemas/allotments.schema';

export class UpdateAllotmentStatusDto {
  @ApiProperty({
    description: 'Status of the allotment',
    enum: AllotmentStatus,
    example: AllotmentStatus.FOR_PROCESSING,
  })
  @IsEnum(AllotmentStatus)
  @IsNotEmpty()
  status: AllotmentStatus;
}
