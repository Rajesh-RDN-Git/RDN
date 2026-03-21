import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { CommunicationGateway } from './communication.gateway';
import { CallService } from './services/call.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || 'dev-secret',
      }),
    }),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationGateway, CallService],
  exports: [CommunicationService, CommunicationGateway],
})
export class CommunicationModule {}
