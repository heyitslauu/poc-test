import { PartialType } from '@nestjs/swagger';
import { CreateModificationDto } from './create-modification.dto';

export class UpdateModificationDto extends PartialType(CreateModificationDto) {}
