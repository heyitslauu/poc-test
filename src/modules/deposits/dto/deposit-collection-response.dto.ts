import { ApiProperty } from '@nestjs/swagger';

export class DepositCollectionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the deposit collection link',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the deposit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  deposit_id: string;

  @ApiProperty({
    description: 'UUID of the collection',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  collection_id: string;

  @ApiProperty({
    description: 'Timestamp when the deposit collection link was created',
    example: '2026-01-23T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the deposit collection link was last updated',
    example: '2026-01-23T10:00:00.000Z',
  })
  updated_at: Date;
}
