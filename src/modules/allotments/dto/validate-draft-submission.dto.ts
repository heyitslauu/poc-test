import { IsEnum, IsNumber, IsString, IsNotEmpty, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
} from '../../../database/schemas/allotments.schema';

export class ValidateDraftSubmissionDto {
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  allotment_code: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @IsEnum(FundCluster)
  @IsOptional()
  fund_cluster?: FundCluster;

  @IsString()
  @IsNotEmpty()
  particulars: string;

  @IsEnum(AppropriationType)
  @IsOptional()
  appropriation_type?: AppropriationType;

  @IsEnum(BfarsBudgetType)
  @IsOptional()
  bfars_budget_type?: BfarsBudgetType;

  @IsEnum(AllotmentType)
  @IsOptional()
  allotment_type?: AllotmentType;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'total_allotment must have at most 2 decimal places' })
  @Min(0)
  @IsNotEmpty()
  total_allotment: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  workflow_id?: string;
}
