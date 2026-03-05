import { Module } from '@nestjs/common';
import { DepositsController } from './controllers/deposits.controller';
import { DepositCollectionsController } from './controllers/deposit-collections.controller';
import { DepositJournalEntriesController } from './controllers/deposit-journal-entries.controller';
import { DepositsService } from './services/deposits.service';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [DepositsController, DepositCollectionsController, DepositJournalEntriesController],
  providers: [DepositsService],
})
export class DepositsModule {}
