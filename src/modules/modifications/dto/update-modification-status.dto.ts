import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ModificationStatus } from '../../../database/schemas/modification.schema';

export class UpdateModificationStatusDto {
  @ApiProperty({
    description: 'Status of the modification',
    enum: ModificationStatus,
    example: ModificationStatus.FOR_TRIAGE,
  })
  @IsEnum(ModificationStatus)
  status: ModificationStatus;
}
