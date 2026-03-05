import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateAllotmentDetailDto {
  @ApiProperty({ description: 'ID of the allotment' })
  @IsNotEmpty()
  @IsUUID()
  allotment_id: string;

  @ApiProperty({ description: 'ID of the office' })
  @IsNotEmpty()
  @IsUUID()
  office_id: string;

  @ApiProperty({ description: 'ID of the PAP' })
  @IsNotEmpty()
  @IsUUID()
  pap_id: string;

  @ApiProperty({ description: 'ID of the RCA' })
  @IsNotEmpty()
  @IsUUID()
  rca_id: string;

  @ApiPropertyOptional({ description: 'ID of the RCA sub-object' })
  @IsOptional()
  @IsUUID()
  rca_sub_object_id?: string;

  @ApiProperty({ description: 'Amount allocated' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}
