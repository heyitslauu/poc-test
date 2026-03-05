import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { PaymentDetailsController } from './controllers/payment-details.controller';
import { PaymentDetailsService } from './services/payment-details.service';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PaymentsController, PaymentDetailsController],
  providers: [PaymentsService, PaymentDetailsService],
})
export class PaymentsModule {}
