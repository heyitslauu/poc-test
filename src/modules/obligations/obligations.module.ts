import { Module } from '@nestjs/common';
import { ObligationsController } from './controllers/obligations.controller';
import { ObligationsService } from './services/obligations.service';
import { DatabaseModule } from '@/database/database.module';
import { ObligationDetailsController } from './controllers/obligation-details.controller';
import { ObligationDetailsService } from './services/obligation-details.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ObligationsController, ObligationDetailsController],
  providers: [ObligationsService, ObligationDetailsService],
  exports: [ObligationDetailsService],
})
export class ObligationsModule {}
