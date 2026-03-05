import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min, IsNotEmpty } from 'class-validator';
import {
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
} from '../../../database/schemas/allotments.schema';

export class CreateAllotmentDto {
  @ApiProperty({
    description: 'Unique code identifier for the allotment',
    example: 'ALLOTMENT-00001',
  })
  @IsString()
  @IsNotEmpty()
  allotment_code: string;

  @ApiProperty({
    description: 'Date when the allotment was issued or recorded',
    example: '2025-10-27',
  })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiPropertyOptional({
    description: 'Classification of the fund source according to government accounting standards',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @ApiProperty({
    description: 'Detailed description or specific purpose of the allotment',
    example: 'Procurement of Office Supplies for Q4',
  })
  @IsString()
  @IsNotEmpty()
  particulars: string;

  @ApiPropertyOptional({
    description: 'Category of the appropriation (e.g., Current vs. Continuing)',
    enum: AppropriationType,
    example: AppropriationType.CURRENT_APPROPRIATION,
  })
  @IsEnum(AppropriationType)
  @IsOptional()
  appropriation_type?: AppropriationType;

  @ApiPropertyOptional({
    description: 'Specific budget type classification as per BFARs',
    enum: BfarsBudgetType,
    example: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
  })
  @IsEnum(BfarsBudgetType)
  @IsOptional()
  bfars_budget_type?: BfarsBudgetType;

  @ApiPropertyOptional({
    description: 'Type of allotment release (e.g., Direct Release, Centrally Managed)',
    enum: AllotmentType,
    example: AllotmentType.DIRECT_RELEASE,
  })
  @IsEnum(AllotmentType)
  @IsOptional()
  allotment_type?: AllotmentType;

  @ApiProperty({
    description: 'Total monetary value of the allotment',
    minimum: 0,
    example: 150000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'total_allotment must have at most 2 decimal places' })
  @Min(0)
  @IsNotEmpty()
  total_allotment: number;

  @ApiPropertyOptional({
    description: 'Optional additional notes or comments regarding the allotment',
    example: 'Pending final approval from budget officer',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Workflow ID associated with the allotment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsString()
  @IsOptional()
  workflow_id?: string;
}
