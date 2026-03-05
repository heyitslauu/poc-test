import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ImportOfficeDto {
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
}
