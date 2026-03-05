import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { PayeeType } from '../../../database/schemas/payees.schema';
export class ImportEmployeePayeeRowDto {
  @ApiProperty({
    example: 'EMP-001',
    description: 'Employee number used to look up the employee record',
  })
  @IsString()
  @IsNotEmpty()
  employee_number: string;

  @ApiPropertyOptional({
    example: '123-456-789-000',
    description: 'Tax Identification Number of the payee',
  })
  @IsString()
  @IsOptional()
  tin_no?: string;

  @ApiPropertyOptional({
    example: '001234567890',
    description: 'Bank account number of the payee',
  })
  @IsString()
  @IsOptional()
  bank_account_no?: string;
}
export class ImportNonEmployeePayeeRowDto {
  @ApiProperty({
    example: PayeeType.CREDITOR,
    enum: [PayeeType.CREDITOR, PayeeType.SUPPLIER],
    description: 'Payee type — must be CREDITOR or SUPPLIER',
  })
  @IsEnum([PayeeType.CREDITOR, PayeeType.SUPPLIER], {
    message: `type must be one of: ${PayeeType.CREDITOR}, ${PayeeType.SUPPLIER}`,
  })
  @IsNotEmpty()
  type: PayeeType.CREDITOR | PayeeType.SUPPLIER;

  @ApiProperty({
    example: 'Juan Dela Cruz',
    description: 'Name of the payee',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '123-456-789-000',
    description: 'Tax Identification Number of the payee',
  })
  @IsString()
  @IsOptional()
  tin_no?: string;

  @ApiPropertyOptional({
    example: '001234567890',
    description: 'Bank account number of the payee',
  })
  @IsString()
  @IsOptional()
  bank_account_no?: string;
}
export class ImportPayeesResponseDto {
  @ApiProperty({ example: 10, description: 'Number of rows successfully imported' })
  successful_rows: number;

  @ApiProperty({ example: 2, description: 'Number of rows that failed to import' })
  failed_rows: number;

  @ApiProperty({
    type: [Object],
    description: 'Array of failed rows with error details',
    example: [
      {
        row_number: 2,
        data: { type: 'EMPLOYEE', name: 'Test', tin_no: '', bank_account_no: '' },
        errors: ['type must be one of: CREDITOR, SUPPLIER'],
      },
    ],
  })
  failed_rows_details: Array<{
    row_number: number;
    data: ImportEmployeePayeeRowDto | ImportNonEmployeePayeeRowDto;
    errors: string[];
  }>;

  @ApiProperty({
    example: 'Import completed with 10 successful and 2 failed rows',
    description: 'Import result message',
  })
  message: string;
}

export class ImportPayeeValidationErrorDto {
  @ApiProperty({ example: 3, description: 'Row number in the file (1-based)' })
  row_number: number;

  @ApiProperty({ description: 'Original row data from file' })
  data: ImportEmployeePayeeRowDto | ImportNonEmployeePayeeRowDto;

  @ApiProperty({ type: [String], description: 'List of validation errors for this row' })
  errors: string[];
}
