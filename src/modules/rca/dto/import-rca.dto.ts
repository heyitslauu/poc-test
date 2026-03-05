import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ImportRcaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}
