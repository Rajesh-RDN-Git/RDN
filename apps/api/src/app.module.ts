import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { RedisModule } from './common/redis/redis.module';
import { PrismaModule } from './database/prisma.module';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  awsConfig,
  jwtConfig,
  msg91Config,
  exotelConfig,
  authConfig,
  cryptoConfig,
} from './config';
import { CryptoModule } from './common/crypto/crypto.module';
import { SocietyScopeMiddleware } from './common/middleware/society-scope.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SocietiesModule } from './modules/societies/societies.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { SearchModule } from './modules/search/search.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DealersModule } from './modules/dealers/dealers.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommissionModule } from './modules/commission/commission.module';
import { VerificationModule } from './modules/verification/verification.module';
import { GrievanceModule } from './modules/grievance/grievance.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MediaModule } from './modules/media/media.module';
import { AdminModule } from './modules/admin/admin.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        awsConfig,
        jwtConfig,
        msg91Config,
        exotelConfig,
        authConfig,
        cryptoConfig,
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CryptoModule,
    AuthModule,
    UsersModule,
    SocietiesModule,
    PropertiesModule,
    SearchModule,
    LeadsModule,
    DealersModule,
    CommunicationModule,
    NotificationsModule,
    CommissionModule,
    VerificationModule,
    GrievanceModule,
    ReferralModule,
    ReportsModule,
    MediaModule,
    AdminModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SocietyScopeMiddleware).forRoutes('v1/properties', 'v1/leads', 'v1/dealers');
  }
}
