import { PartialType } from '@nestjs/swagger';
import { CreateEarmarkDetailDto } from './create-earmark-detail.dto';

export class UpdateEarmarkDetailDto extends PartialType(CreateEarmarkDetailDto) {}
