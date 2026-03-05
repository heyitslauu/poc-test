import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';

export class CreateObligationDetailBodyDto {
  @ApiProperty({
    description: 'UUID of the allotment details',
    example: 'b1ffcd00-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsString()
  @IsNotEmpty()
  allotment_details_id: string;

  @ApiProperty({
    description: 'Amount',
    minimum: 0,
    example: 50000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must have at most 2 decimal places' })
  @Min(0)
  @IsNotEmpty()
  amount: number;
}
