import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  awsConfig,
  jwtConfig,
  msg91Config,
} from './config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, awsConfig, jwtConfig, msg91Config],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SocietyScopeMiddleware).forRoutes('v1/properties', 'v1/leads', 'v1/dealers');
  }
}
