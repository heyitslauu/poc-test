import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CollectionStatus } from '@/database/schemas/collections.schema';

export class UpdateCollectionStatusDto {
  @ApiProperty({
    description: 'Status of the collection',
    enum: CollectionStatus,
    example: CollectionStatus.DRAFT,
  })
  @IsEnum(CollectionStatus)
  status: CollectionStatus;

  @ApiPropertyOptional({
    description: 'Remarks for the status update (e.g. rejection reason)',
    example: 'Incorrect particulars',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
