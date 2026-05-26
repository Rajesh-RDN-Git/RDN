import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './services/device-token.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokens: DeviceTokenService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  async findAll(
    @Query() query: QueryNotificationsDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.notificationsService.findAll(query, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string): Promise<any> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('device-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register or refresh a device push token' })
  async registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.deviceTokens.register(userId, dto);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Unregister a device push token (on logout/uninstall)' })
  async removeDeviceToken(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.deviceTokens.remove(userId, token);
  }
}
