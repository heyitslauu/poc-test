import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsUUID, IsOptional, IsArray } from 'class-validator';
import { CreateWithdrawalDetailInputDto } from './create-withdrawal-detail-input.dto';

export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'UUID of the sub ARO to withdraw from',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  sub_aro_id: string;

  @ApiProperty({
    description: 'Withdrawal code',
    example: 'WD-202601-00001',
  })
  @IsString()
  withdrawal_code: string;

  @ApiProperty({
    description: 'Date of the withdrawal',
    example: '2026-01-23',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Details of the withdrawal',
    example: 'Withdraw funds for project X',
  })
  @IsString()
  particulars: string;

  @ApiProperty({
    description: 'Optional details for the withdrawal',
    example: [
      {
        sub_aro_details_id: '9c923b83-2f88-497f-81b5-bbba8ff4079c',
        amount: 10000.5,
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  details?: CreateWithdrawalDetailInputDto[];
}
