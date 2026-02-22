import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { PropertiesService } from './properties.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all properties' })
  findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new property listing' })
  create(@Body() body: any) {
    return this.propertiesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property by ID' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.propertiesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete property by ID' })
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
