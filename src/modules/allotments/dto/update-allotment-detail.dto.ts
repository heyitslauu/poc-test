import { PartialType } from '@nestjs/swagger';
import { CreateAllotmentDetailBodyDto } from './create-allotment-detail-body.dto';

export class UpdateAllotmentDetailDto extends PartialType(CreateAllotmentDetailBodyDto) {}
