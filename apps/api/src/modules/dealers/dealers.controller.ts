import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { DealersService } from './dealers.service';

@ApiTags('Dealers')
@Controller('dealers')
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @Get()
  @ApiOperation({ summary: 'List all dealers' })
  findAll(@Query() query: any) {
    return this.dealersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dealer by ID' })
  findOne(@Param('id') id: string) {
    return this.dealersService.findOne(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply to become a dealer' })
  apply(@Body() body: any) {
    return this.dealersService.apply(body);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve dealer application' })
  approve(@Param('id') id: string) {
    return this.dealersService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject dealer application' })
  reject(@Param('id') id: string) {
    return this.dealersService.reject(id);
  }
}
