import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateWithdrawalDetailDto {
  @ApiProperty({
    description: 'UUID of the withdrawal',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  withdrawal_id: string;

  @ApiProperty({
    description: 'UUID of the sub-aro detail',
    example: 'b1ffcd00-9d0c-4ef9-bb6e-6bb9bd380a12',
  })
  sub_aro_details_id: string;

  @ApiProperty({
    description: 'Amount for the withdrawal',
    example: 100000,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @Min(0)
  @IsNotEmpty()
  amount: number;
}
