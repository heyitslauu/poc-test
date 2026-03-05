import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';
import { PayeeType } from '@/database/schemas/payees.schema';

export class CreateCollectionDetailDto {
  @ApiProperty({
    description: 'UUID of the collection',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  collection_id: string;

  @ApiPropertyOptional({
    description: 'UUID of the PAP (Program, Activity, and Project) - optional',
    example: 'd10cc589-d715-4382-ac5a-01bb3e9811cb',
  })
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : (value as string)))
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUUID()
  @IsOptional()
  paps_id?: string | null;

  @ApiProperty({
    description: 'Type of payee',
    enum: PayeeType,
    example: PayeeType.CREDITOR,
  })
  @IsEnum(PayeeType)
  @IsNotEmpty()
  payee_type: PayeeType;

  @ApiProperty({
    description: 'UUID of the payee',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  payee_id: string;

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
