import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallService } from './call.service';
import { PrismaService } from '../../../database/prisma.service';

function makeConfig(values: Record<string, unknown>): ConfigService {
  return { get: (k: string) => values[k] } as unknown as ConfigService;
}

// A valid, callable lead assigned to dealer user 'd-user'.
const lead = {
  id: 'lead-1',
  dealer: { userId: 'd-user', user: { id: 'd-user', phone: '+919999900020' } },
  buyer: { phone: '+919999900005' },
  contactPhone: null,
};
const prismaStub = {
  lead: { findUnique: jest.fn().mockResolvedValue(lead) },
} as unknown as PrismaService;

describe('CallService — Exotel configuration safety', () => {
  it('throws ServiceUnavailable in production when Exotel is not configured', async () => {
    const service = new CallService(makeConfig({ 'app.environment': 'production' }), prismaStub);
    await expect(service.initiateCall('d-user', 'lead-1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns a mock (not an error) in development when Exotel is not configured', async () => {
    const service = new CallService(makeConfig({ 'app.environment': 'development' }), prismaStub);
    const result = await service.initiateCall('d-user', 'lead-1');
    expect(result.status).toBe('mock');
  });
});
