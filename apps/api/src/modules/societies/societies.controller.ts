import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { SocietiesService } from './societies.service';

@ApiTags('Societies')
@Controller('societies')
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all societies' })
  findAll(@Query() query: any) {
    return this.societiesService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get society by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.societiesService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new society' })
  create(@Body() body: any) {
    return this.societiesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update society by ID' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.societiesService.update(id, body);
  }
}
