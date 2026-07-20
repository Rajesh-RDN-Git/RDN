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
  buyerId: 'b-user',
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

  it('lets the buyer initiate the call too (not just the dealer)', async () => {
    const service = new CallService(makeConfig({ 'app.environment': 'development' }), prismaStub);
    const result = await service.initiateCall('b-user', 'lead-1');
    expect(result.status).toBe('mock');
  });

  it('rejects a caller who is neither the buyer nor the dealer', async () => {
    const service = new CallService(makeConfig({ 'app.environment': 'development' }), prismaStub);
    await expect(service.initiateCall('stranger', 'lead-1')).rejects.toThrow(
      /buyer or the assigned dealer/,
    );
  });
});

describe('CallService — Exotel response handling', () => {
  const configured = {
    'app.environment': 'production',
    'exotel.apiKey': 'k',
    'exotel.apiToken': 't',
    'exotel.sid': 's',
    'exotel.callerId': '+918000000000',
    'exotel.subdomain': 'api.exotel.com',
  };
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('throws when Exotel rejects the call (e.g. 403 not-KYC) instead of faking success', async () => {
    const service = new CallService(makeConfig(configured), prismaStub);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        RestException: { Status: 403, Message: 'Your account is not yet KYC compliant.' },
      }),
    }) as unknown as typeof fetch;

    await expect(service.initiateCall('d-user', 'lead-1')).rejects.toThrow();
  });

  it('returns initiated with the call sid on a successful Exotel response', async () => {
    const service = new CallService(makeConfig(configured), prismaStub);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ Call: { Sid: 'CA123' } }),
    }) as unknown as typeof fetch;

    const result = await service.initiateCall('d-user', 'lead-1');
    expect(result.status).toBe('initiated');
    expect(result.callSid).toBe('CA123');
  });
});
