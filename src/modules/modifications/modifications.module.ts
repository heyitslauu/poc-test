import { Module } from '@nestjs/common';
import { ModificationsController } from './controllers/modifications.controller';
import { ModificationsService } from './services/modifications.service';
import { DatabaseModule } from '@/database/database.module';
import { ModificationDetailsController } from './controllers/modification-details.controller';
import { ModificationDetailsService } from './services/modification-details.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ModificationsController, ModificationDetailsController],
  providers: [ModificationsService, ModificationDetailsService],
})
export class ModificationsModule {}
