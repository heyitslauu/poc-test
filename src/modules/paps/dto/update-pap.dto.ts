import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePapDto {
  @ApiPropertyOptional({
    description: 'PAP Code',
    example: '200000100001000',
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(15)
  code?: string;

  @ApiPropertyOptional({
    description: 'PAP Name',
    example: 'Information and Communication Technology Management',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the PAP is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
