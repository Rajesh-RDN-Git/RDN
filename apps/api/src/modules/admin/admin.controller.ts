import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { updateUserRoleSchema, type UpdateUserRoleInput } from '@rdn/shared';
import { AdminService } from './admin.service';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { OnboardSocietyDto } from './dto/onboard-society.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats(): Promise<any> {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with filtering' })
  async getUsers(@Query() query: QueryAdminUsersDto): Promise<any> {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change a user role (standalone roles only)' })
  async setUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema)) body: UpdateUserRoleInput,
    @CurrentUser() actor: { id: string; role: string },
  ): Promise<any> {
    return this.adminService.setUserRole(id, body.role, actor);
  }

  @Post('societies/onboard')
  @ApiOperation({ summary: 'Onboard a new society' })
  async onboardSociety(@Body() body: OnboardSocietyDto): Promise<any> {
    return this.adminService.onboardSociety(body);
  }
}
