import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImportAllotmentDetailRowDto {
  @ApiProperty({ example: 'OFF001', description: 'Office code' })
  @IsString()
  @IsNotEmpty()
  office_code: string;

  @ApiProperty({ example: 'PAP001', description: 'PAP code' })
  @IsString()
  @IsNotEmpty()
  pap_code: string;

  @ApiProperty({ example: 'RCA001', description: 'RCA code' })
  @IsString()
  @IsNotEmpty()
  rca_code: string;

  @ApiProperty({ example: 100000, description: 'Amount' })
  @IsNumber()
  @Min(0)
  @Transform(({ value }): number | string => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  amount: number;
}

export class ImportAllotmentDetailsResponseDto {
  @ApiProperty({ example: 150, description: 'Number of rows successfully imported' })
  successful_rows: number;

  @ApiProperty({ example: 5, description: 'Number of rows that failed to import' })
  failed_rows: number;

  @ApiProperty({
    type: [Object],
    description: 'Array of failed rows with error details',
    example: [
      {
        row_number: 2,
        data: { office_code: 'OFF999', pap_code: 'PAP001', rca_code: 'RCA001', amount: 50000 },
        errors: ['Office with code OFF999 not found or is inactive'],
      },
    ],
  })
  failed_rows_details: Array<{
    row_number: number;
    data: ImportAllotmentDetailRowDto;
    errors: string[];
  }>;

  @ApiProperty({
    example: 'Import completed with 150 successful and 5 failed rows',
    description: 'Import result message',
  })
  message: string;
}

export class ImportValidationErrorDto {
  @ApiProperty({ example: 2, description: 'Row number in the file (1-based)' })
  row_number: number;

  @ApiProperty({
    description: 'Original row data from file',
    example: { office_code: 'OFF999', pap_code: 'PAP001', rca_code: 'RCA001', amount: 50000 },
  })
  data: ImportAllotmentDetailRowDto;

  @ApiProperty({
    type: [String],
    description: 'List of validation errors for this row',
    example: ['Office with code OFF999 not found or is inactive', 'Amount must be a positive number'],
  })
  errors: string[];
}
