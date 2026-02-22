import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin platform statistics' })
  getStats(@Query() query: any) {
    return this.adminService.getStats(query);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users for admin management' })
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Post('societies/onboard')
  @ApiOperation({ summary: 'Onboard a new society via admin' })
  onboardSociety(@Body() body: any) {
    return this.adminService.onboardSociety(body);
  }
}
