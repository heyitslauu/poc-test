import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
} from '../../../database/schemas/allotments.schema';

export class AllotmentDraftResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the allotment draft',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'allotment code associated with the draft',
    example: 'ALLOT-2025-001',
  })
  allotment_code: string;

  @ApiProperty({
    description: 'UUID of the user who created the allotment draft',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: 'UUID of the target allotment if linked',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  target_allotment_id?: string | null;

  @ApiPropertyOptional({
    description: 'Unique reference identifier for tracking the allotment document',
    example: 'ALLOT-2025-001',
    nullable: true,
  })
  tracking_reference?: string | null;

  @ApiPropertyOptional({
    description: 'Date when the allotment was issued or recorded',
    example: '2025-10-27T00:00:00.000Z',
    nullable: true,
  })
  date?: Date | null;

  @ApiPropertyOptional({
    description: 'Classification of the fund source',
    enum: FundCluster,
    example: FundCluster.REGULAR_AGENCY_FUND,
    nullable: true,
  })
  fund_cluster?: FundCluster | null;

  @ApiPropertyOptional({
    description: 'Detailed description or specific purpose',
    example: 'Procurement of Office Supplies for Q4',
    nullable: true,
  })
  particulars?: string | null;

  @ApiPropertyOptional({
    description: 'Category of the appropriation',
    enum: AppropriationType,
    example: AppropriationType.CURRENT_APPROPRIATION,
    nullable: true,
  })
  appropriation_type?: AppropriationType | null;

  @ApiPropertyOptional({
    description: 'Specific budget type classification',
    enum: BfarsBudgetType,
    example: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
    nullable: true,
  })
  bfars_budget_type?: BfarsBudgetType | null;

  @ApiPropertyOptional({
    description: 'Type of allotment release',
    enum: AllotmentType,
    example: AllotmentType.DIRECT_RELEASE,
    nullable: true,
  })
  allotment_type?: AllotmentType | null;

  @ApiPropertyOptional({
    description: 'Total monetary value of the allotment',
    example: 150000.0,
    nullable: true,
  })
  @Transform(({ value }) => (value ? value / 100 : null))
  total_allotment?: number | null;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
    example: 'Pending final approval from budget officer',
    nullable: true,
  })
  remarks?: string | null;

  @ApiPropertyOptional({
    description: 'Workflow ID associated with the allotment draft',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  workflow_id?: string | null;

  @ApiProperty({
    description: 'Timestamp when the allotment draft was created',
    example: '2026-01-19T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the allotment draft was last updated',
    example: '2026-01-19T10:00:00.000Z',
  })
  updated_at: Date;
}
