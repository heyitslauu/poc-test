import { Module } from '@nestjs/common';
import { AllotmentsService } from './allotments.service';
import { AllotmentsController } from './allotments.controller';
import { DatabaseModule } from '../../database/database.module';
import { AllotmentDetailsController } from './controllers';
import { AllotmentDetailsService } from './services';

@Module({
  imports: [DatabaseModule],
  controllers: [AllotmentsController, AllotmentDetailsController],
  providers: [AllotmentsService, AllotmentDetailsService],
})
export class AllotmentsModule {}
