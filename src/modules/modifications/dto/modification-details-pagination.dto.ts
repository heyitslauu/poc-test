import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max, IsUUID, IsEnum } from 'class-validator';
import { ModificationAction } from '../../../database/schemas/modification-details.schema';

export class ModificationDetailsPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by allotment detail ID',
    example: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
  })
  @IsOptional()
  @IsUUID()
  allotment_details_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by sub-aro detail ID',
    example: 'c2ggde11-9e0d-4fg0-cc7f-7cc9ce381c23',
  })
  @IsOptional()
  @IsUUID()
  sub_aro_details_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by action',
    enum: ModificationAction,
    example: ModificationAction.ADD,
  })
  @IsOptional()
  @IsEnum(ModificationAction)
  action?: ModificationAction;
}
