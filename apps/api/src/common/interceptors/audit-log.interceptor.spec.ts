import { of } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaService } from '../../database/prisma.service';

describe('AuditLogInterceptor', () => {
  const create = jest.fn().mockResolvedValue({});
  const prisma = { auditLog: { create } } as unknown as PrismaService;
  const interceptor = new AuditLogInterceptor(prisma);

  const makeContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('scrubs PII from the persisted request body', async () => {
    const request = {
      method: 'POST',
      url: '/v1/dealers/apply',
      params: {},
      user: { id: 'user-1' },
      ip: '127.0.0.1',
      headers: {},
      body: {
        societyId: 'soc-1',
        phone: '+919812345678',
        bankAccountDetails: { account: '1234567890', ifsc: 'HDFC0001' },
      },
    };
    const next: CallHandler = { handle: () => of({ id: 'd-1' }) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(makeContext(request), next).subscribe(() => {
        setImmediate(resolve);
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
    const changes = create.mock.calls[0][0].data.changes;
    expect(changes.phone).toBe('[redacted]');
    expect(changes.bankAccountDetails).toBe('[redacted]');
    expect(changes.societyId).toBe('soc-1');
  });
});
