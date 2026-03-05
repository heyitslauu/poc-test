import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { SubAroResponseDto } from './sub-aro-response.dto';
import { AllotmentDetailResponseDto } from '../../allotments/dto/allotment-detail-response.dto';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import { SubObjectResponseDto } from '../../rca/dto/sub-object-response.dto';
import { truncateAmount } from '@/common/utils/validation.util';

export class SubAroDetailsResponseDto {
  @ApiProperty({ description: 'Unique identifier of the sub-aro detail' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID of the associated sub-aro' })
  @Expose()
  sub_aro_id: string;

  @ApiPropertyOptional({ description: 'Sub-aro details', type: () => SubAroResponseDto })
  @Expose()
  sub_aro?: SubAroResponseDto;

  @ApiProperty({ description: 'ID of the allotment details (UACS)' })
  @Expose()
  uacs_id: string;

  @ApiPropertyOptional({ description: 'Allotment details (UACS)', type: AllotmentDetailResponseDto })
  @Expose()
  uacs?: AllotmentDetailResponseDto;

  @ApiProperty({ description: 'ID of the PAP' })
  @Expose()
  pap_id: string;

  @ApiPropertyOptional({ description: 'PAP details', type: PapResponseDto })
  @Expose()
  pap?: PapResponseDto;

  @ApiProperty({ description: 'ID of the RCA' })
  @Expose()
  rca_id: string;

  @ApiPropertyOptional({ description: 'RCA details', type: RcaResponseDto })
  @Expose()
  rca?: RcaResponseDto;

  @ApiPropertyOptional({ description: 'ID of the RCA sub-object' })
  @Expose()
  rca_sub_object_id?: string | null;

  @ApiPropertyOptional({ description: 'RCA sub-object details', type: SubObjectResponseDto })
  @Expose()
  rca_sub_object?: SubObjectResponseDto | null;

  @ApiProperty({
    description: 'Total amount from all details',
    example: 5000,
    required: false,
  })
  @Transform(({ value }) => truncateAmount(value / 100, 2))
  amount: number;

  @ApiProperty({ description: 'Timestamp when the detail was created' })
  @Expose()
  created_at: Date;

  @ApiProperty({ description: 'Timestamp when the detail was last updated' })
  @Expose()
  updated_at: Date;
}
