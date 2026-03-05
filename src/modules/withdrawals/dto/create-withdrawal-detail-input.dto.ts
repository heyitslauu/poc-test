import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateWithdrawalDetailInputDto {
  @ApiProperty({
    description: 'UUID of the sub-aro detail',
    example: '9c923b83-2f88-497f-81b5-bbba8ff4079c',
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
