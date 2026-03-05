import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateSubAroDetailsDto {
  @ApiProperty({
    description: 'UUID of the sub-aro',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  sub_aro_id: string;

  @ApiProperty({
    description: 'UUID of the allotment details (UACS)',
    example: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
  })
  @IsUUID()
  uacs_id: string;

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
