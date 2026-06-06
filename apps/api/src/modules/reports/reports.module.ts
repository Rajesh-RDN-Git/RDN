import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { PublicStatsController } from './public-stats.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController, PublicStatsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
