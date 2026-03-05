import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubObjectDto {
  @ApiPropertyOptional({
    description: 'Sub Object Code',
    example: '01',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Sub Object Name',
    example: 'Training Expenses',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the sub object is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
