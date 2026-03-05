import { Module } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { OfficesController } from './offices.controller';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [OfficesController],
  providers: [OfficesService],
})
export class OfficesModule {}
