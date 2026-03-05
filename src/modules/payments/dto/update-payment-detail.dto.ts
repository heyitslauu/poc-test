import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class UpdatePaymentDetailDto {
  @ApiPropertyOptional({
    description: 'User ID who owns this payment detail',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Payment ID this detail belongs to',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  payment_id?: string;

  @ApiPropertyOptional({
    description: "Journal entry ID. The payee_id provided must match this journal entry's payee",
    example: '789e0123-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  journal_entry_id?: string;

  @ApiPropertyOptional({
    description: 'Payee ID. Must match journal entry payee exactly',
    example: '012e3456-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsOptional()
  payee_id?: string;

  @ApiPropertyOptional({
    description: 'Payment amount in smallest currency unit (e.g., cents)',
    example: 15000,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;
}
