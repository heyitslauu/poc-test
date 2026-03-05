import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class UpdateAllotmentWorkflowDto {
  @ApiProperty({
    description: 'Linked exFLOW workflow ID',
    example: '72aa994f-c345-469d-92f3-119a1777e016',
  })
  @IsString()
  @IsUUID()
  workflow_id: string;
}
