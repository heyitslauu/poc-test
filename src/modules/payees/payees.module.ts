import { Module } from '@nestjs/common';
import { PayeesService } from './payees.service';
import { PayeesController } from './payees.controller';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from '@/common/s3';

@Module({
  imports: [DatabaseModule, ConfigModule, S3Module],
  controllers: [PayeesController],
  providers: [PayeesService],
})
export class PayeesModule {}
