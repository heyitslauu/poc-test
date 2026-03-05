import { PartialType } from '@nestjs/swagger';
import { CreateSubAroDto } from './create-sub-aro.dto';

export class UpdateSubAroDto extends PartialType(CreateSubAroDto) {}
