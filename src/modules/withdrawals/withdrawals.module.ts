import { Module } from '@nestjs/common';
import { WithdrawalsController } from './controllers/withdrawals.controller';
import { WithdrawalsService } from './services/withdrawals.service';
import { DatabaseModule } from '@/database/database.module';
import { WithdrawDetailsController } from './controllers/withdraw-details.controller';
import { WithdrawDetailsService } from './services/withdraw-details.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WithdrawalsController, WithdrawDetailsController],
  providers: [WithdrawalsService, WithdrawDetailsService],
})
export class WithdrawalsModule {}
