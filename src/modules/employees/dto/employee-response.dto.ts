import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({
    description: 'Employee unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User ID associated with the employee',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Employee number',
    example: 'EMP-2026-001',
  })
  employee_number?: string | null;

  @ApiProperty({
    description: 'Employee first name',
    example: 'Juan',
  })
  first_name: string;

  @ApiPropertyOptional({
    description: 'Employee middle name',
    example: 'Dela Cruz',
  })
  middle_name?: string | null;

  @ApiProperty({
    description: 'Employee last name',
    example: 'Santos',
  })
  last_name: string;

  @ApiPropertyOptional({
    description: 'Employee name extension',
    example: 'Jr.',
  })
  extension_name?: string | null;
}
