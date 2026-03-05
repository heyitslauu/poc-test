import { Module } from '@nestjs/common';
import { PapsService } from './paps.service';
import { PapsController } from './paps.controller';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from '@/common/s3';
@Module({
  imports: [DatabaseModule, ConfigModule, S3Module],
  controllers: [PapsController],
  providers: [PapsService],
})
export class PapsModule {}
