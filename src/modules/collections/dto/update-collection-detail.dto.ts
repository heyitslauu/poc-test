import { PartialType } from '@nestjs/swagger';
import { CreateCollectionDetailBodyDto } from './create-collection-detail-body.dto';

export class UpdateCollectionDetailDto extends PartialType(CreateCollectionDetailBodyDto) {}
