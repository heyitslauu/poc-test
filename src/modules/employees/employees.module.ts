import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { DatabaseModule } from '@/database/database.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
