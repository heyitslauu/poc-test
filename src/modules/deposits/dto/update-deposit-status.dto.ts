import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DepositStatus } from '@/database/schemas/deposits.schema';

export class UpdateDepositStatusDto {
  @ApiProperty({
    description: 'Status of the deposit',
    enum: DepositStatus,
    example: DepositStatus.DRAFT,
  })
  @IsEnum(DepositStatus)
  status: DepositStatus;

  @ApiPropertyOptional({
    description: 'Remarks for the status update (e.g. rejection reason)',
    example: 'Incorrect details',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
