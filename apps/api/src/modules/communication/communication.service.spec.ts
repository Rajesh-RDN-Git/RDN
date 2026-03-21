import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { PrismaService } from '../../database/prisma.service';

describe('CommunicationService', () => {
  let service: CommunicationService;

  const mockPrisma = {
    conversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    lead: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommunicationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    jest.clearAllMocks();
  });

  describe('findAllConversations', () => {
    it('should return conversations for user', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([{ id: 'conv-1' }]);
      mockPrisma.conversation.count.mockResolvedValue(1);

      const result = await service.findAllConversations({} as any, 'user-1');
      expect(result).toEqual({ data: [{ id: 'conv-1' }], total: 1, page: 1, limit: 20 });
    });
  });

  describe('findConversation', () => {
    it('should return conversation with messages', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        participants: ['user-1', 'user-2'],
      });
      mockPrisma.message.findMany.mockResolvedValue([{ id: 'msg-1' }]);
      mockPrisma.message.count.mockResolvedValue(1);
      mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.findConversation('conv-1', {} as any, 'user-1');
      expect(result.conversation.id).toBe('conv-1');
      expect(result.messages).toHaveLength(1);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);
      await expect(service.findConversation('x', {} as any, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not participant', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        participants: ['user-2', 'user-3'],
      });
      await expect(service.findConversation('conv-1', {} as any, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createConversation', () => {
    it('should return existing conversation if exists', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      mockPrisma.conversation.findFirst.mockResolvedValue({ id: 'existing-conv' });

      const result = await service.createConversation(
        { leadId: 'lead-1', participantId: 'user-2' } as any,
        'user-1',
      );
      expect(result).toEqual({ id: 'existing-conv' });
    });

    it('should create new conversation with initial message', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.conversation.create.mockResolvedValue({ id: 'new-conv' });
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

      const result = await service.createConversation(
        { leadId: 'lead-1', participantId: 'user-2', message: 'Hello' } as any,
        'user-1',
      );
      expect(result).toEqual({ id: 'new-conv' });
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should throw if lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);
      await expect(
        service.createConversation({ leadId: 'x', participantId: 'u2' } as any, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage', () => {
    it('should send message and update lastMessageAt', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        participants: ['user-1', 'user-2'],
      });
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage('conv-1', { content: 'Hi' } as any, 'user-1');
      expect(result).toEqual({ id: 'msg-1' });
    });

    it('should throw ForbiddenException if not participant', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        participants: ['user-2', 'user-3'],
      });
      await expect(
        service.sendMessage('conv-1', { content: 'Hi' } as any, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
