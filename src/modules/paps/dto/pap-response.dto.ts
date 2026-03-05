import { ApiProperty } from '@nestjs/swagger';

export class PapResponseDto {
  @ApiProperty({
    description: 'PAP unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'PAP code',
    example: '200000100001000',
  })
  code: string;

  @ApiProperty({
    description: 'PAP name',
    example: 'Information and Communication Technology Management',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the PAP is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'PAP creation timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'PAP last update timestamp',
    example: '2026-01-13T10:30:00.000Z',
  })
  updated_at: Date;
}
