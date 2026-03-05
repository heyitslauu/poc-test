import { Module } from '@nestjs/common';
import { SubAroController } from './controllers/sub-aro.controller';
import { SubAroService } from './services/sub-aro.service';
import { DatabaseModule } from '@/database/database.module';
import { SubAroDetailsController } from './controllers/sub-aro-details.controller';
import { SubAroDetailsService } from './services/sub-aro-details.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SubAroController, SubAroDetailsController],
  providers: [SubAroService, SubAroDetailsService],
})
export class SubAroModule {}
