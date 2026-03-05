import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayeeType } from '../../../database/schemas/payees.schema';

export class PayeeResponseDto {
  @ApiProperty({
    description: 'Payee unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID associated with the payee',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Employee ID associated with the payee if type is EMPLOYEE',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  employee_id?: string;

  @ApiProperty({
    description: 'Type of the payee',
    example: 'EMPLOYEE',
    enum: PayeeType,
  })
  type: PayeeType;

  @ApiPropertyOptional({
    description: 'Name of the payee',
    example: 'Juan Dela Cruz',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Tax Identification Number of the payee',
    example: '123-456-789-000',
  })
  tin_no?: string;

  @ApiPropertyOptional({
    description: 'Bank account number of the payee',
    example: '001234567890',
  })
  bank_account_no?: string;
}
