import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { CommunicationService } from './communication.service';

@ApiTags('Communication')
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations' })
  findAllConversations(@Query() query: any) {
    return this.communicationService.findAllConversations(query);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID with messages' })
  findConversation(@Param('id') id: string) {
    return this.communicationService.findConversation(id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(@Param('id') id: string, @Body() body: any) {
    return this.communicationService.sendMessage(id, body);
  }
}
