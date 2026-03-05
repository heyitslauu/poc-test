import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'pino-nestjs';
import { DatabaseModule } from './database/database.module';
import { getThrottlerConfig } from './config/throttler.config';
import { OfficesModule } from './modules/offices/offices.module';
import { PapsModule } from './modules/paps/paps.module';
import { RcaModule } from './modules/rca/rca.module';
import { AllotmentsModule } from './modules/allotments/allotments.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModificationsModule } from './modules/modifications/modifications.module';
import { SubAroModule } from './modules/sub-aro/sub-aro.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PayeesModule } from './modules/payees/payees.module';
import { ObligationsModule } from './modules/obligations/obligations.module';
import { DisbursementsModule } from './modules/disbursements/disbursements.module';
import { JournalEntriesModule } from './modules/journal-entries/journal-entries.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { EarmarksModule } from './modules/earmarks/earmarks.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttlerConfig = getThrottlerConfig(configService);

        return [
          {
            ttl: throttlerConfig.ttl,
            limit: throttlerConfig.limit,
            skipIf: () => throttlerConfig.isDev,
          },
        ];
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        autoLogging: true,
        transport: {
          targets: [
            {
              target: 'pino/file',
              level: 'info',
              options: {
                destination: './logs/app.log',
                mkdir: true,
              },
            },
            {
              target: 'pino-pretty',
              level: 'info',
              options: {
                destination: 1,
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            },
          ],
        },
      },
    }),
    DatabaseModule,
    AuthModule,
    OfficesModule,
    PapsModule,
    RcaModule,
    AllotmentsModule,
    ModificationsModule,
    SubAroModule,
    WithdrawalsModule,
    EmployeesModule,
    PayeesModule,
    ObligationsModule,
    DisbursementsModule,
    JournalEntriesModule,
    PaymentsModule,
    CollectionsModule,
    DepositsModule,
    EarmarksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
