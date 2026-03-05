import { ApiProperty } from '@nestjs/swagger';
import { SubAroStatus } from '../../../database/schemas/sub-aro.schema';
import { SubAroDetailsResponseDto } from './sub-aro-details-response.dto';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';

export class SubAroResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the sub-aro',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who created the sub-aro',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiProperty({
    description: 'UUID of the office',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  office_id: string;

  @ApiProperty({
    description: 'Office details',
    type: OfficeResponseDto,
  })
  office: OfficeResponseDto;

  @ApiProperty({
    description: 'UUID of the allotment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  allotment_id: string;

  @ApiProperty({
    description: 'Allotment code',
    example: 'AC-2026-01-A1B2C3D4',
    nullable: true,
  })
  allotment_code: string | null;

  @ApiProperty({
    description: 'Unique sub-aro code',
    example: 'SAR-202601-00001',
  })
  sub_aro_code: string;

  @ApiProperty({
    description: 'Date of the sub-aro',
    example: '2026-01-23T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Details of the sub-aro',
    example: 'Sub-allotment for office supplies',
  })
  particulars: string;

  @ApiProperty({
    description: 'Status of the sub-aro',
    enum: SubAroStatus,
    example: SubAroStatus.DRAFT,
  })
  status: SubAroStatus;

  @ApiProperty({
    description: 'Timestamp when the sub-aro was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the sub-aro was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'List of sub-aro details',
    type: [() => SubAroDetailsResponseDto],
  })
  details: SubAroDetailsResponseDto[];
}
