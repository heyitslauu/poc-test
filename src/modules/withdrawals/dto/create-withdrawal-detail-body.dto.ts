import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateWithdrawalDetailBodyDto {
  @ApiProperty({
    description: 'UUID of the sub-aro detail',
    example: 'b1ffcd00-9d0c-4ef9-bb6e-6bb9bd380a12',
  })
  @IsString()
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
