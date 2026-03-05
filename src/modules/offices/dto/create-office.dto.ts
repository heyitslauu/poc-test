import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateOfficeDto {
  @ApiProperty({
    description: 'Office Code',
    example: '20-001-03-00005',
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  code: string;

  @ApiProperty({
    description: 'Office Name',
    example: 'Regional Office - V',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Whether the office is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
