import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConsentService } from './consent.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ConsentService],
  exports: [UsersService, ConsentService],
})
export class UsersModule {}
