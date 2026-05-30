import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT')
  @ApiOperation({ summary: 'Get dashboard overview stats (role-aware)' })
  async getDashboard(
    @Query() query: QueryReportDto,
    @CurrentUser() user: { id: string; role: string; societyId?: string },
  ): Promise<any> {
    return this.reportsService.getDashboard(query, user);
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
  @Roles('SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Get leads report with conversion metrics' })
  async getLeads(@Query() query: QueryReportDto): Promise<any> {
    return this.reportsService.getLeads(query);
  }
}
