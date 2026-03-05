import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ImportPapDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}
