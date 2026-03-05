import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { OfficeResponseDto } from '../../offices/dto/office-response.dto';
import { PapResponseDto } from '../../paps/dto/pap-response.dto';
import { RcaResponseDto } from '../../rca/dto/rca-response.dto';
import { SubObjectResponseDto } from '../../rca/dto/sub-object-response.dto';

export class AllotmentDetailResponseDto {
  @ApiProperty({ description: 'Unique identifier of the allotment detail' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'ID of the user who created the detail' })
  @Expose()
  user_id: string;

  @ApiProperty({ description: 'ID of the associated allotment' })
  @Expose()
  allotment_id: string;

  @ApiProperty({ description: 'ID of the office' })
  @Expose()
  office_id: string;

  @ApiPropertyOptional({ description: 'Office details', type: OfficeResponseDto })
  @Expose()
  office?: OfficeResponseDto;

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
  rca_sub_object?: SubObjectResponseDto;

  @ApiProperty({ description: 'Allocated amount' })
  @Expose()
  amount: number;
}
