import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RetentionCron } from './retention.cron';

@Module({
  controllers: [AdminController],
  providers: [AdminService, RetentionCron],
  exports: [AdminService],
})
export class AdminModule {}
