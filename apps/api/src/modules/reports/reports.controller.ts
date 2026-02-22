import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  getDashboard(@Query() query: any) {
    return this.reportsService.getDashboard(query);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions report' })
  getTransactions(@Query() query: any) {
    return this.reportsService.getTransactions(query);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Get commissions report' })
  getCommissions(@Query() query: any) {
    return this.reportsService.getCommissions(query);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get leads report' })
  getLeads(@Query() query: any) {
    return this.reportsService.getLeads(query);
  }
}
