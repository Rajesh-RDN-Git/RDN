import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { QueryConversationsDto } from './dto/query-conversations.dto';
import type { QueryMessagesDto } from './dto/query-messages.dto';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllConversations(query: QueryConversationsDto, userId: string): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    // Find conversations where user is a participant
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { array_contains: [userId] },
      },
      skip,
      take: limit,
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        lead: {
          select: {
            id: true,
            property: { select: { id: true, flatNumber: true, towerBlock: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, senderId: true, createdAt: true },
        },
      },
    });

    const total = await this.prisma.conversation.count({
      where: { participants: { array_contains: [userId] } },
    });

    return { data: conversations, total, page, limit };
  }

  async findConversation(
    id: string,
    messagesQuery: QueryMessagesDto,
    userId: string,
  ): Promise<any> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { lead: { select: { id: true, status: true } } },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check user is a participant
    const participants = conversation.participants as string[];
    if (!participants.includes(userId)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const page = Number(messagesQuery.page) || 1;
    const limit = Math.min(Number(messagesQuery.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          type: true,
          senderId: true,
          receiverId: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.message.count({ where: { conversationId: id } }),
    ]);

    // Mark unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { conversation, messages, total, page, limit };
  }

  async createConversation(data: CreateConversationDto, userId: string): Promise<any> {
    // Verify lead exists
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    // Check for existing conversation for this lead between these users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        leadId: data.leadId,
        participants: { array_contains: [userId, data.participantId] },
      },
    });
    if (existing) return existing;

    const conversation = await this.prisma.conversation.create({
      data: {
        leadId: data.leadId,
        participants: [userId, data.participantId],
        lastMessageAt: data.message ? new Date() : null,
      },
    });

    // Send initial message if provided
    if (data.message) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          receiverId: data.participantId,
          content: data.message,
          type: 'TEXT',
        },
      });
    }

    return conversation;
  }

  // Resolve the other conversation participant, but only if `userId` is actually
  // a member — used by the WS gateway so a client cannot target arbitrary rooms.
  async getOtherParticipant(conversationId: string, userId: string): Promise<string | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return null;
    const participants = conversation.participants as string[];
    if (!participants.includes(userId)) return null;
    return participants.find((p) => p !== userId) || null;
  }

  async sendMessage(conversationId: string, data: SendMessageDto, userId: string): Promise<any> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const participants = conversation.participants as string[];
    if (!participants.includes(userId)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const receiverId = participants.find((p) => p !== userId) || participants[0];

    const [message] = await Promise.all([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId,
          content: data.content,
          type: (data.type as any) || 'TEXT',
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }
}
