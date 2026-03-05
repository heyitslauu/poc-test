import { ApiProperty } from '@nestjs/swagger';
import { ModificationStatus } from '../../../database/schemas/modification.schema';
import { ModificationDetailResponseDto } from './modification-detail-response.dto';
import { Transform } from 'class-transformer';
import { truncateAmount } from '@/common/utils/validation.util';

export enum ModificationType {
  ALLOTMENT = 'ALLOTMENT',
  SARO = 'SARO',
}

export class ModificationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the modification',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Type of modification',
    enum: ModificationType,
    example: ModificationType.ALLOTMENT,
  })
  type: ModificationType;

  @ApiProperty({
    description: 'Unique request ID in format MR-YYYYMM-XXXXX',
    example: 'MR-202601-00001',
  })
  modification_code: string;

  @ApiProperty({
    description: 'User ID who created the modification',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiProperty({
    description: 'UUID of the allotment being modified',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  allotment_id?: string;

  @ApiProperty({
    description: 'UUID of the sub-ARO being modified',
    example: 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22',
    required: false,
  })
  sub_aro_id?: string;

  @ApiProperty({
    description: 'Allotment code associated with the modification',
    example: 'AL-202601-00001',
    required: false,
  })
  allotment_code?: string;

  @ApiProperty({
    description: 'Sub-ARO code associated with the modification',
    example: 'SA-202601-00001',
    required: false,
  })
  sub_aro_code?: string;

  @ApiProperty({
    description: 'Date of the modification',
    example: '2026-01-23T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Details of the modification',
    example: 'Increase allotment by 10%',
  })
  particulars: string;

  @ApiProperty({
    description: 'Status of the modification',
    enum: ModificationStatus,
    example: ModificationStatus.DRAFT,
  })
  status: ModificationStatus;

  @ApiProperty({
    description: 'Timestamp when the modification was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the modification was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Array of modification details',
    type: [ModificationDetailResponseDto],
    required: false,
  })
  details?: ModificationDetailResponseDto[];

  @ApiProperty({
    description: 'Total amount from all details',
    example: 5000,
    required: false,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  total_amount?: number;
}
