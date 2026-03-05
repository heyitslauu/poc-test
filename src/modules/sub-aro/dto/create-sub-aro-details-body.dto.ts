import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateSubAroDetailsBodyDto {
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
