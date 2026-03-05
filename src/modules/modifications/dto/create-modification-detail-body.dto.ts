import { OmitType } from '@nestjs/swagger';
import { CreateModificationDetailDto } from './create-modification-detail.dto';

export class CreateModificationDetailBodyDto extends OmitType(CreateModificationDetailDto, [
  'modification_id',
] as const) {}
