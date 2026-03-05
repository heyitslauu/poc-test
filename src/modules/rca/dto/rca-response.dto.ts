import { ApiProperty } from '@nestjs/swagger';

export class RcaResponseDto {
  @ApiProperty({
    description: 'RCA unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'RCA code',
    example: '5-02-01-010',
  })
  code: string;

  @ApiProperty({
    description: 'RCA name',
    example: 'Salaries and Wages - Regular',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the RCA is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Whether the RCA allows sub objects',
    example: false,
  })
  allows_sub_object: boolean;

  @ApiProperty({
    description: 'RCA creation timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'RCA last update timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  updated_at: Date;
}
