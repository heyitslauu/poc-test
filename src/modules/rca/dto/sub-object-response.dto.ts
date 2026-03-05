import { ApiProperty } from '@nestjs/swagger';

export class SubObjectResponseDto {
  @ApiProperty({
    description: 'Sub object unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Parent RCA ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  rca_id: string;

  @ApiProperty({
    description: 'Sub object code',
    example: '01',
  })
  code: string;

  @ApiProperty({
    description: 'Sub object name',
    example: 'Training Expenses',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the sub object is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Sub object creation timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Sub object last update timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  updated_at: Date;
}
