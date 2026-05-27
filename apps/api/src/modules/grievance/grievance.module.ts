import { Module } from '@nestjs/common';
import { GrievanceController } from './grievance.controller';
import { DpdpGrievanceController } from './dpdp-grievance.controller';
import { GrievanceService } from './grievance.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [GrievanceController, DpdpGrievanceController],
  providers: [GrievanceService],
  exports: [GrievanceService],
})
export class GrievanceModule {}
