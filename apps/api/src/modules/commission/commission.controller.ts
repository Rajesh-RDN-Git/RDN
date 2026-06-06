import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionService } from './commission.service';
import { QueryCommissionsDto } from './dto/query-commissions.dto';
import { SettleCommissionDto } from './dto/settle-commission.dto';
import { CancelCommissionDto } from './dto/cancel-commission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Commission')
@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'DEALER')
  @ApiOperation({ summary: 'List commissions' })
  async findAll(@Query() query: QueryCommissionsDto): Promise<any> {
    return this.commissionService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'DEALER')
  @ApiOperation({ summary: 'Get commission by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.commissionService.findOne(id);
  }

  @Post(':id/settle')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Settle a commission payment' })
  async settle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SettleCommissionDto,
  ): Promise<any> {
    return this.commissionService.settle(id, body);
  }

  @Post(':id/distribute')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Mark a settled commission as distributed (paid out)' })
  async distribute(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.commissionService.distribute(id);
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancel a commission' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelCommissionDto = {},
  ): Promise<any> {
    return this.commissionService.cancel(id, body);
  }
}
