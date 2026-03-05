import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString, Min, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateObligationDto {
  @ApiProperty({
    description: 'UUID of the payee',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  payee_id: string;

  @ApiProperty({
    description: 'Detailed description of the obligation',
    example: 'Payment for services rendered',
  })
  @IsString()
  @IsNotEmpty()
  particulars: string;

  @ApiProperty({
    description: 'Date of the obligation',
    example: '2026-01-30',
  })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiPropertyOptional({
    description: 'Type of transaction',
    example: 'Direct Payment',
  })
  @IsString()
  @IsOptional()
  transaction_type?: string;

  @ApiProperty({
    description: 'Monetary amount of the obligation',
    minimum: 0,
    example: 50000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must have at most 2 decimal places' })
  @Min(0)
  @IsNotEmpty()
  amount: number;
}
