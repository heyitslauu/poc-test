import { PartialType } from '@nestjs/swagger';
import { CreateSubAroDetailsDto } from './create-sub-aro-details.dto';

export class UpdateSubAroDetailsDto extends PartialType(CreateSubAroDetailsDto) {}
