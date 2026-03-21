import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../database/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockPrisma = {
    lead: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
    dealer: {
      findFirst: jest.fn(),
    },
  };

  const mockTransactionsService = { create: jest.fn() };
  const mockNotificationsService = { create: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should scope queries for DEALER role', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll({}, 'user-1', 'DEALER');

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ dealer: { userId: 'user-1' } }),
        }),
      );
    });

    it('should scope queries for BUYER_TENANT role', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll({}, 'user-1', 'BUYER_TENANT');

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ buyerId: 'user-1' }),
        }),
      );
    });

    it('should return paginated results', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1' }]);
      mockPrisma.lead.count.mockResolvedValue(1);

      const result = await service.findAll(
        { page: '1', limit: '10' } as any,
        'user-1',
        'SUPER_ADMIN',
      );

      expect(result).toEqual({ data: [{ id: 'lead-1' }], total: 1, page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return lead by id', async () => {
      const mockLead = { id: 'lead-1', status: 'NEW' };
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);

      const result = await service.findOne('lead-1');
      expect(result).toEqual(mockLead);
    });

    it('should throw NotFoundException if lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const mockProperty = {
      id: 'prop-1',
      societyId: 'soc-1',
      ownerId: 'owner-1',
      status: 'ACTIVE',
      assignedDealerId: 'dealer-1',
      assignedDealer: { id: 'dealer-1' },
    };

    it('should create lead with assigned dealer', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-1',
        dealer: { user: { id: 'user-d1' } },
        property: { flatNumber: 'A-101', towerBlock: 'Tower A' },
      });

      await service.create({ propertyId: 'prop-1', source: 'WEBSITE' }, 'buyer-1');

      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyId: 'prop-1',
            buyerId: 'buyer-1',
            dealerId: 'dealer-1',
          }),
        }),
      );
    });

    it('should auto-assign dealer if property has none', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        ...mockProperty,
        assignedDealerId: null,
      });
      mockPrisma.dealer.findFirst.mockResolvedValue({ id: 'auto-dealer-1' });
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-1',
        dealer: { user: { id: 'user-d1' } },
        property: { flatNumber: 'A-101', towerBlock: 'Tower A' },
      });

      await service.create({ propertyId: 'prop-1', source: 'WEBSITE' }, 'buyer-1');

      expect(mockPrisma.dealer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { societyId: 'soc-1', isActive: true },
        }),
      );
    });

    it('should throw if property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ propertyId: 'nonexistent', source: 'WEBSITE' }, 'buyer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if property not ACTIVE', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        ...mockProperty,
        status: 'DELISTED',
      });

      await expect(
        service.create({ propertyId: 'prop-1', source: 'WEBSITE' }, 'buyer-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('closeDeal', () => {
    it('should close deal for NEGOTIATING status', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead-1', status: 'NEGOTIATING' });
      mockPrisma.lead.update.mockResolvedValue({ id: 'lead-1', status: 'CLOSED' });
      mockTransactionsService.create.mockResolvedValue({ id: 'txn-1' });

      const result = await service.closeDeal('lead-1', { type: 'SALE', dealValue: 5000000 });

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { status: 'CLOSED' },
      });
      expect(mockTransactionsService.create).toHaveBeenCalledWith({
        leadId: 'lead-1',
        type: 'SALE',
        dealValue: 5000000,
      });
    });

    it('should throw if lead not in NEGOTIATING or CLOSING status', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead-1', status: 'NEW' });

      await expect(
        service.closeDeal('lead-1', { type: 'SALE', dealValue: 5000000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveVisit', () => {
    it('should approve visit for property owner', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        property: { ownerId: 'owner-1' },
      });
      mockPrisma.lead.update.mockResolvedValue({ visitApprovedByOwner: true });

      await service.approveVisit('lead-1', 'owner-1');

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { visitApprovedByOwner: true },
      });
    });

    it('should throw if user is not property owner', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        property: { ownerId: 'other-owner' },
      });

      await expect(service.approveVisit('lead-1', 'wrong-user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
