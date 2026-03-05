import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class ImportJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  payee: string;

  @IsString()
  @IsOptional()
  source_ors?: string;

  @IsString()
  @IsNotEmpty()
  pap: string;

  @IsString()
  @IsNotEmpty()
  object_code: string;

  @IsString()
  @IsOptional()
  sub_object_code?: string;

  @IsNumber()
  @IsOptional()
  debit?: number;

  @IsNumber()
  @IsOptional()
  credit?: number;
}
