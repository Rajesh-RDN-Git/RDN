import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'RWA_ADMIN')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  async getDashboard(@Query() query: QueryReportDto): Promise<any> {
    return this.reportsService.getDashboard(query);
  }

  @Get('transactions')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get transactions report' })
  async getTransactions(@Query() query: QueryReportDto): Promise<any> {
    return this.reportsService.getTransactions(query);
  }

  @Get('commissions')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get commissions report' })
  async getCommissions(@Query() query: QueryReportDto): Promise<any> {
    return this.reportsService.getCommissions(query);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get leads report with conversion metrics' })
  async getLeads(@Query() query: QueryReportDto): Promise<any> {
    return this.reportsService.getLeads(query);
  }
}
