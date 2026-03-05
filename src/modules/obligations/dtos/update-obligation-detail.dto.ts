import { PartialType } from '@nestjs/swagger';
import { CreateObligationDetailDto } from './create-obligation-detail.dto';

export class UpdateObligationDetailDto extends PartialType(CreateObligationDetailDto) {}
