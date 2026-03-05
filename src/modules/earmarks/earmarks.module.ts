import { Module } from '@nestjs/common';
import { EarmarksController } from './controllers/earmarks.controller';
import { EarmarksService } from './services/earmarks.service';
import { DatabaseModule } from '@/database/database.module';
import { EarmarkDetailsController } from './controllers/earmark-details.controller';
import { EarmarkDetailsService } from './services/earmark-details.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EarmarksController, EarmarkDetailsController],
  providers: [EarmarksService, EarmarkDetailsService],
})
export class EarmarksModule {}
