import { Module } from '@nestjs/common';
import { CollectionsController } from './controllers/collections.controller';
import { CollectionsService } from './services/collections.service';
import { CollectionDetailsController } from './controllers/collection-details.controller';
import { CollectionDetailsService } from './services/collection-details.service';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [CollectionsController, CollectionDetailsController],
  providers: [CollectionsService, CollectionDetailsService],
})
export class CollectionsModule {}
