import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsUUID } from 'class-validator';

export class CreateSubAroDto {
  @ApiProperty({
    description: 'UUID of the allotment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  allotment_id: string;

  @ApiProperty({
    description: 'UUID of the office',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  office_id: string;

  @ApiProperty({
    description: 'Unique sub-aro code',
    example: 'SAR-202601-00001',
  })
  @IsString()
  sub_aro_code: string;

  @ApiProperty({
    description: 'Date of the sub-aro',
    example: '2026-01-23',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Details of the sub-aro',
    example: 'Sub-allotment for office supplies',
  })
  @IsString()
  particulars: string;
}
