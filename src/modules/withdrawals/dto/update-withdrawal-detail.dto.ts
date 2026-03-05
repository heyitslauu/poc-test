import { PartialType } from '@nestjs/swagger';
import { CreateWithdrawalDetailDto } from './create-withdrawal-detail.dto';

export class UpdateWithdrawalDetailDto extends PartialType(CreateWithdrawalDetailDto) {}
