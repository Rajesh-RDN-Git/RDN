import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { GrievanceService } from './grievance.service';

@ApiTags('Grievance')
@Controller('grievances')
export class GrievanceController {
  constructor(private readonly grievanceService: GrievanceService) {}

  @Get()
  @ApiOperation({ summary: 'List all grievances' })
  findAll(@Query() query: any) {
    return this.grievanceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grievance by ID' })
  findOne(@Param('id') id: string) {
    return this.grievanceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'File a new grievance' })
  create(@Body() body: any) {
    return this.grievanceService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update grievance by ID' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.grievanceService.update(id, body);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate a grievance' })
  escalate(@Param('id') id: string) {
    return this.grievanceService.escalate(id);
  }
}
