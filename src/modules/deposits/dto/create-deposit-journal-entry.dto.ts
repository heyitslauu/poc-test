import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateDepositJournalEntryDto {
  @ApiPropertyOptional({
    description: 'UUID of the PAP (Program, Activity, and Project) - nullable',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  @IsUUID()
  @IsOptional()
  paps_id?: string;

  @ApiProperty({
    description: 'UUID of the UACS (Revised Chart of Accounts)',
    example: '154eab66-cd6b-4f93-8d3b-32e1ea05fecf',
  })
  @IsUUID()
  @IsNotEmpty()
  uacs_id: string;

  @ApiProperty({
    description: 'Debit amount in pesos',
    example: 10000.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Debit must have at most 2 decimal places' })
  @Min(0)
  debit: number;

  @ApiProperty({
    description: 'Credit amount in pesos',
    example: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Credit must have at most 2 decimal places' })
  @Min(0)
  credit: number;
}
