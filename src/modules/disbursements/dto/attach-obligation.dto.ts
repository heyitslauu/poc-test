import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AttachObligationDto {
  @ApiProperty({
    description: 'The UUID of the obligation detail to attach to the disbursement',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  obligation_detail_id: string;
}
