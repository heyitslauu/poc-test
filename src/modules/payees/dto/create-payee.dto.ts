import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { PayeeType } from '../../../database/schemas/payees.schema';

export class CreatePayeeDto {
  @ApiPropertyOptional({
    description: 'Employee ID associated with the payee if type is EMPLOYEE',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  employee_id?: string;

  @ApiProperty({
    description: 'Type of the payee',
    example: PayeeType.EMPLOYEE,
    enum: PayeeType,
  })
  @IsEnum(PayeeType)
  @IsNotEmpty()
  type: PayeeType;

  @ApiPropertyOptional({
    description: 'Name of the payee',
    example: 'Juan Dela Cruz',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Tax Identification Number of the payee',
    example: '123-456-789-000',
  })
  @IsString()
  @IsOptional()
  tin_no?: string;

  @ApiPropertyOptional({
    description: 'Bank account number of the payee',
    example: '001234567890',
  })
  @IsString()
  @IsOptional()
  bank_account_no?: string;
}
