import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateRcaDto {
  @ApiProperty({
    description: 'RCA Code',
    example: '5-02-01-010',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({
    description: 'RCA Name',
    example: 'Salaries and Wages - Regular',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Whether the RCA is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the RCA allows sub objects',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allows_sub_object?: boolean;
}
