import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ModificationAction } from '../../../database/schemas/modification-details.schema';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import { truncateAmount } from '@/common/utils/validation.util';

export class ModificationDetailResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the modification detail',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the modification request',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  modification_id: string;

  @ApiPropertyOptional({
    description: 'UUID of the allotment detail',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  allotment_details_id?: string;

  @ApiPropertyOptional({
    description: 'UUID of the sub-aro detail',
    example: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
  })
  sub_aro_details_id?: string;

  @ApiProperty({
    description: 'ID of the office',
    example: '91b811ca-da7a-4851-8fac-8c3e0358c1f9',
  })
  office_id: string;

  @ApiPropertyOptional({
    description: 'Office details',
    type: OfficeResponseDto,
  })
  office?: OfficeResponseDto;

  @ApiProperty({
    description: 'ID of the PAP',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  pap_id: string;

  @ApiPropertyOptional({
    description: 'PAP details',
    type: PapResponseDto,
  })
  pap?: PapResponseDto;

  @ApiProperty({
    description: 'ID of the RCA',
    example: '154eab66-cd6b-4f93-8d3b-32e1ea05fecf',
  })
  rca_id: string;

  @ApiPropertyOptional({
    description: 'RCA details',
    type: RcaResponseDto,
  })
  rca?: RcaResponseDto;

  @ApiProperty({
    description: 'Action to perform on the allotment',
    enum: ModificationAction,
    example: ModificationAction.ADD,
  })
  action: ModificationAction;

  @ApiProperty({
    description: 'Amount to add or subtract',
    example: 5000,
    required: false,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  amount: number;

  @ApiProperty({
    description: 'Timestamp when the modification detail was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the modification detail was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;
}
