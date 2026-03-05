import { ApiProperty } from '@nestjs/swagger';

export class OfficeResponseDto {
  @ApiProperty({
    description: 'Office unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Office code',
    example: 'OFF-001',
  })
  code: string;

  @ApiProperty({
    description: 'Office name',
    example: 'Main Office',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the office is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Office creation timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Office last update timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  updated_at: Date;
}
