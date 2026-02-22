import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { LeadsService } from './leads.service';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List all leads' })
  findAll(@Query() query: any) {
    return this.leadsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(@Body() body: any) {
    return this.leadsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead by ID' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.leadsService.update(id, body);
  }
}
