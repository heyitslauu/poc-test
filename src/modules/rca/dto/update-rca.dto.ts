import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class UpdateRcaDto {
  @ApiPropertyOptional({
    description: 'RCA Code',
    example: '5-02-01-010',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'RCA Name',
    example: 'Salaries and Wages - Regular',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the RCA is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the RCA allows sub objects',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  allows_sub_object?: boolean;
}
