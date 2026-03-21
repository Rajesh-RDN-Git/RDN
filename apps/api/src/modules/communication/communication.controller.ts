import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CallService } from './services/call.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication')
@Controller('communication')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly callService: CallService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for current user' })
  async findAllConversations(
    @Query() query: QueryConversationsDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.communicationService.findAllConversations(query, userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a conversation (linked to a lead)' })
  async createConversation(
    @Body() body: CreateConversationDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.communicationService.createConversation(body, userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with paginated messages' })
  async findConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryMessagesDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.communicationService.findConversation(id, query, userId);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendMessageDto,
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.communicationService.sendMessage(id, body, userId);
  }

  @Post('call')
  @UseGuards(RolesGuard)
  @Roles('DEALER')
  @ApiOperation({ summary: 'Initiate masked call (dealer only)' })
  async initiateCall(
    @Body() body: { leadId: string },
    @CurrentUser('id') userId: string,
  ): Promise<any> {
    return this.callService.initiateCall(userId, body.leadId);
  }
}
