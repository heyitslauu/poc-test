import { PartialType } from '@nestjs/swagger';
import { CreateModificationDetailDto } from './create-modification-detail.dto';

export class UpdateModificationDetailDto extends PartialType(CreateModificationDetailDto) {}
