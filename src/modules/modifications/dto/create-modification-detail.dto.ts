import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

import { ModificationAction } from '../../../database/schemas/modification-details.schema';

export class CreateModificationDetailDto {
  @ApiProperty({
    description: 'UUID of the modification',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty()
  modification_id: string;

  @ApiPropertyOptional({
    description: 'UUID of the allotment detail',
    example: 'b1ffcd00-9d0c-4ef9-bb6e-6bb9bd380a12',
  })
  @IsOptional()
  @ValidateIf((o: CreateModificationDetailDto) => o.action !== ModificationAction.ADD && !o.sub_aro_details_id)
  @IsNotEmpty({ message: 'Either allotment_details_id or sub_aro_details_id must be provided' })
  allotment_details_id?: string;

  @ApiPropertyOptional({
    description: 'UUID of the sub-aro detail',
    example: 'c2ggde11-9e0d-4fg0-cc7f-7cc9ce381c23',
  })
  @IsOptional()
  @ValidateIf((o: CreateModificationDetailDto) => o.action !== ModificationAction.ADD && !o.allotment_details_id)
  @IsNotEmpty({ message: 'Either allotment_details_id or sub_aro_details_id must be provided' })
  sub_aro_details_id?: string;

  @ApiProperty({
    description: 'Action for the modification',
    enum: ModificationAction,
    example: ModificationAction.ADD,
  })
  @IsNotEmpty()
  @IsEnum(ModificationAction)
  action: ModificationAction;

  @ApiPropertyOptional({
    description: 'UUID of the Office. Required when action is ADD.',
    example: 'd3hhef22-9f0e-4gh1-dd8g-8dd0df492d34',
  })
  @ValidateIf((o: CreateModificationDetailDto) => o.action === ModificationAction.ADD)
  @IsNotEmpty({ message: 'office_id is required when action is ADD' })
  office_id?: string;

  @ApiPropertyOptional({
    description: 'UUID of the PAP (Program, Activity, Project). Required when action is ADD.',
    example: 'd3hhef22-9f0e-4gh1-dd8g-8dd0df492d34',
  })
  @ValidateIf((o: CreateModificationDetailDto) => o.action === ModificationAction.ADD)
  @IsNotEmpty({ message: 'pap_id is required when action is ADD' })
  pap_id?: string;

  @ApiPropertyOptional({
    description: 'UUID of the RCA (Revised Chart of Accounts). Required when action is ADD.',
    example: 'e4iifg33-9g0f-4hi2-ee9h-9ee1eg503e45',
  })
  @ValidateIf((o: CreateModificationDetailDto) => o.action === ModificationAction.ADD)
  @IsNotEmpty({ message: 'rca_id is required when action is ADD' })
  rca_id?: string;

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
