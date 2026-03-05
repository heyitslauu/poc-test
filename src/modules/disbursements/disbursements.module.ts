import { Module } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { DisbursementsController } from './disbursements.controller';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';
import { ObligationsModule } from '../obligations/obligations.module';

@Module({
  imports: [DatabaseModule, ConfigModule, JournalEntriesModule, ObligationsModule],
  controllers: [DisbursementsController],
  providers: [DisbursementsService],
})
export class DisbursementsModule {}
