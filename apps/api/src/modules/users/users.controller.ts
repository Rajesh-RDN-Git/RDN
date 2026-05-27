import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { updateUserSchema } from '@rdn/shared';
import { UsersService } from './users.service';
import { ConsentService } from './consent.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GrantConsentDto } from './dto/consent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

function clientIp(req: Request): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  return req.ip;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly consentService: ConsentService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get('me/data-export')
  @Throttle({ default: { ttl: 3600_000, limit: 3 } })
  @ApiOperation({
    summary: 'DPDP data portability — export current user data as JSON',
    description:
      'Returns user profile, owned properties, leads, messages, notifications, consent ledger.',
  })
  async exportMe(@CurrentUser('id') userId: string): Promise<unknown> {
    return this.usersService.exportData(userId);
  }

  @Get('me/consent')
  @ApiOperation({ summary: 'Current consent state per purpose' })
  getConsent(@CurrentUser('id') userId: string) {
    return this.consentService.current(userId);
  }

  @Get('me/consent/history')
  @ApiOperation({ summary: 'Full consent audit log' })
  getConsentHistory(@CurrentUser('id') userId: string) {
    return this.consentService.history(userId);
  }

  @Post('me/consent')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Grant or withdraw consent for a purpose' })
  grantConsent(
    @Body() dto: GrantConsentDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.consentService.grantOrWithdraw(userId, dto, clientIp(req));
  }

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List all users (admin only)' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (user.id !== id && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, body);
  }

  @Delete('me')
  @Throttle({ default: { ttl: 3600_000, limit: 3 } })
  @ApiOperation({
    summary: 'Delete current user account (DPDP erasure + Apple requirement)',
    description:
      'Soft-deletes the account, scrubs PII, removes device tokens. Leads/transactions retained for legal/audit per DPDP Section 8(7).',
  })
  deleteMe(@CurrentUser('id') userId: string) {
    return this.usersService.deleteMe(userId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate user (admin only)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }
}
