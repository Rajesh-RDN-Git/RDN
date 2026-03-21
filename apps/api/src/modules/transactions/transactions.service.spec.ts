import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockTx = {
    transaction: { create: jest.fn() },
    commission: { create: jest.fn() },
    property: { update: jest.fn() },
  };

  const mockPrisma = {
    lead: { findUnique: jest.fn() },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockTx)),
  };

  const mockNotificationsService = { create: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockLead = {
      id: 'lead-1',
      status: 'CLOSED',
      propertyId: 'prop-1',
      dealerId: 'dealer-1',
      buyerId: 'buyer-1',
      property: { ownerId: 'owner-1', flatNumber: 'A-101', towerBlock: 'Tower A' },
      dealer: { userId: 'user-d1', user: { name: 'Dealer 1' } },
      buyer: { name: 'Buyer 1' },
    };

    it('should create transaction and commission for SALE deal', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockTx.transaction.create.mockResolvedValue({ id: 'txn-1' });
      mockTx.commission.create.mockResolvedValue({ id: 'com-1' });

      await service.create({ leadId: 'lead-1', type: 'SALE', dealValue: 10000000 });

      // SALE commission = 1% of deal = 100000
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          type: 'SALE',
          dealValue: 10000000,
        }),
      });

      // Property should be marked SOLD for SALE type
      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { availabilityStatus: 'SOLD', status: 'CLOSED' },
      });
    });

    it('should create transaction for RENT deal with OCCUPIED status', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockTx.transaction.create.mockResolvedValue({ id: 'txn-1' });
      mockTx.commission.create.mockResolvedValue({ id: 'com-1' });

      await service.create({ leadId: 'lead-1', type: 'RENT', dealValue: 25000 });

      // RENT commission = 1 month rent = 25000
      // Property should be marked OCCUPIED for RENT type
      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { availabilityStatus: 'OCCUPIED' },
      });
    });

    it('should throw if lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.create({ leadId: 'x', type: 'SALE', dealValue: 1000 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if lead not CLOSED', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ ...mockLead, status: 'NEW' });

      await expect(
        service.create({ leadId: 'lead-1', type: 'SALE', dealValue: 1000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([{ id: 'txn-1' }]);
      mockPrisma.transaction.count.mockResolvedValue(1);

      const result = await service.findAll({} as any);

      expect(result).toEqual({ data: [{ id: 'txn-1' }], total: 1, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return transaction by id', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({ id: 'txn-1' });

      const result = await service.findOne('txn-1');
      expect(result).toEqual({ id: 'txn-1' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({ id: 'txn-1' });
      mockPrisma.transaction.update.mockResolvedValue({ id: 'txn-1', paymentStatus: 'PAID' });

      const result = await service.updatePaymentStatus('txn-1', { paymentStatus: 'PAID' });
      expect(result.paymentStatus).toBe('PAID');
    });

    it('should throw if transaction not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.updatePaymentStatus('x', { paymentStatus: 'PAID' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
