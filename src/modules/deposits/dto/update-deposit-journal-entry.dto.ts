import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateDepositJournalEntryDto {
  @ApiPropertyOptional({
    description: 'UUID of the PAP (Program, Activity, and Project)',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  @IsOptional()
  @IsString()
  paps_id?: string;

  @ApiPropertyOptional({
    description: 'UUID of the UACS (Revised Chart of Accounts)',
    example: '154eab66-cd6b-4f93-8d3b-32e1ea05fecf',
  })
  @IsOptional()
  @IsString()
  uacs_id?: string;

  @ApiPropertyOptional({
    description: 'Debit amount in pesos',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  debit?: number;

  @ApiPropertyOptional({
    description: 'Credit amount in pesos',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credit?: number;
}
