import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

// Public (unauthenticated) platform stats for the marketing homepage.
// Intentionally has no guards — exposes only aggregate counts, no PII.
@ApiTags('Reports')
@Controller('public/stats')
export class PublicStatsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Public platform stats for trust indicators' })
  async getPublicStats() {
    return this.reportsService.getPublicStats();
  }
}
