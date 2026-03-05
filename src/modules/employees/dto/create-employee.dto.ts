import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiPropertyOptional({
    description: 'User ID associated with the employee',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Employee number',
    example: 'EMP-2026-001',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  employee_number?: string;

  @ApiProperty({
    description: 'Employee first name',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiPropertyOptional({
    description: 'Employee middle name',
    example: 'Dela Cruz',
  })
  @IsString()
  @IsOptional()
  middle_name?: string;

  @ApiProperty({
    description: 'Employee last name',
    example: 'Santos',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({
    description: 'Employee name extension',
    example: 'Jr.',
  })
  @IsString()
  @IsOptional()
  extension_name?: string;
}
