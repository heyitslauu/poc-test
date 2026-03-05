import { Module } from '@nestjs/common';
import { RcaService } from './rca.service';
import { RcaController } from './rca.controller';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from '../../common/s3';

@Module({
  imports: [DatabaseModule, ConfigModule, S3Module],
  controllers: [RcaController],
  providers: [RcaService],
})
export class RcaModule {}
