import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsNotEmpty } from 'class-validator';

export class CreatePaymentDetailBodyDto {
  @ApiProperty({
    description: "Journal entry ID. The payee_id provided must match this journal entry's payee",
    example: '789e0123-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  journal_entry_id: string;

  @ApiProperty({
    description: 'Payee ID. Must match the journal entry payee exactly',
    example: '012e3456-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsNotEmpty()
  payee_id: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit (e.g., cents)',
    example: 15000,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
