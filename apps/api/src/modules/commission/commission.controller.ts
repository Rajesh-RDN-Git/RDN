import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { CommissionService } from './commission.service';

@ApiTags('Commission')
@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  @ApiOperation({ summary: 'List all commissions' })
  findAll(@Query() query: any) {
    return this.commissionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get commission by ID' })
  findOne(@Param('id') id: string) {
    return this.commissionService.findOne(id);
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Settle a commission payment' })
  settle(@Param('id') id: string) {
    return this.commissionService.settle(id);
  }
}
