import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateModificationDetailBodyDto } from './create-modification-detail-body.dto';

export enum ModificationType {
  ALLOTMENT = 'ALLOTMENT',
  SARO = 'SARO',
}

export class CreateModificationDto {
  @ApiProperty({
    description: 'Type of modification',
    enum: ModificationType,
    example: ModificationType.ALLOTMENT,
  })
  @IsEnum(ModificationType)
  type: ModificationType;

  @ApiProperty({
    description: 'UUID of the allotment to modify (required if type is ALLOTMENT)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: CreateModificationDto) => o.type === ModificationType.ALLOTMENT)
  @IsUUID()
  allotment_id?: string;

  @ApiProperty({
    description: 'UUID of the sub-ARO to modify (required if type is SARO)',
    example: 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: CreateModificationDto) => o.type === ModificationType.SARO)
  @IsUUID()
  sub_aro_id?: string;

  @ApiProperty({
    description: 'Modification code',
    example: 'MR-202601-00001',
  })
  @IsString()
  modification_code: string;

  @ApiProperty({
    description: 'Date of the modification',
    example: '2026-01-23',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Details of the modification',
    example: 'Increase allotment by 10%',
  })
  @IsString()
  particulars: string;

  @ApiProperty({
    description: 'Array of modification details',
    type: [CreateModificationDetailBodyDto],
    required: false,
    example: [
      {
        action: 'ADD',
        allotment_details_id: '9c923b83-2f88-497f-81b5-bbba8ff4079c',
        amount: 10000.5,
      },
      {
        action: 'SUBTRACT',
        allotment_details_id: '9c923b83-2f88-497f-81b5-bbba8ff4079c',
        amount: 10000.5,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateModificationDetailBodyDto)
  details?: CreateModificationDetailBodyDto[];
}
