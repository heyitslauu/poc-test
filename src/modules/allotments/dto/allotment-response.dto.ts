import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
  AllotmentStatus,
} from '../../../database/schemas/allotments.schema';
import { AllotmentDetailResponseDto } from './allotment-detail-response.dto';
import { truncateAmount } from '../../../common/utils/validation.util';

export class AllotmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the allotment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Unique allotment code for identification',
    example: 'AC-2026-01-A1B2C3D4',
    nullable: true,
  })
  allotment_code: string | null;

  @ApiProperty({
    description: 'Unique reference identifier for tracking the allotment document',
    example: 'ALLOT-2025-001',
  })
  tracking_reference: string;

  @ApiProperty({
    description: 'UUID of the user who created the allotment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiProperty({
    description: 'Date when the allotment was issued or recorded',
    example: '2025-10-27T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Classification of the fund source',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
  })
  fund_cluster: FundCluster;

  @ApiProperty({
    description: 'Detailed description or specific purpose',
    example: 'Procurement of Office Supplies for Q4',
  })
  particulars: string;

  @ApiProperty({
    description: 'Category of the appropriation',
    enum: AppropriationType,
    example: AppropriationType.CURRENT_APPROPRIATION,
  })
  appropriation_type: AppropriationType;

  @ApiProperty({
    description: 'Specific budget type classification',
    enum: BfarsBudgetType,
    example: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
  })
  bfars_budget_type: BfarsBudgetType;

  @ApiProperty({
    description: 'Type of allotment release',
    enum: AllotmentType,
    example: AllotmentType.DIRECT_RELEASE,
  })
  allotment_type: AllotmentType;

  @ApiProperty({
    description: 'Total monetary value of the allotment',
    example: 150000.0,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  total_allotment: number;

  @ApiProperty({
    description: 'Current status of the allotment',
    enum: AllotmentStatus,
    example: AllotmentStatus.DRAFT,
  })
  status: AllotmentStatus;

  @ApiPropertyOptional({
    description: 'Workflow ID associated with the allotment',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  workflow_id?: string | null;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
    example: 'Pending final approval from budget officer',
    nullable: true,
  })
  remarks: string | null;

  @ApiPropertyOptional({
    description: 'Allotment details (UACS)',
    type: [AllotmentDetailResponseDto],
    nullable: true,
  })
  uacs?: AllotmentDetailResponseDto[];

  @ApiProperty({
    description: 'Timestamp when the allotment was created',
    example: '2026-01-19T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the allotment was last updated',
    example: '2026-01-19T10:00:00.000Z',
  })
  updated_at: Date;
}
