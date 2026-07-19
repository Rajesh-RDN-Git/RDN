import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { RedisService } from '../../../common/redis/redis.service';

function makeConfig(values: Record<string, unknown>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

const redisStub = {} as RedisService;

describe('OtpService — production safety', () => {
  it('refuses to construct when OTP bypass is enabled in production', () => {
    const config = makeConfig({
      'app.environment': 'production',
      'auth.otpDevBypass': 'true',
    });
    expect(() => new OtpService(config, redisStub)).toThrow(
      /OTP_DEV_BYPASS must not be enabled in production/,
    );
  });

  it('refuses to construct when MSG91 credentials are missing in production', () => {
    const config = makeConfig({
      'app.environment': 'production',
      'auth.otpDevBypass': 'false',
    });
    expect(() => new OtpService(config, redisStub)).toThrow(
      /MSG91_AUTH_KEY and MSG91_TEMPLATE_ID must be set in production/,
    );
  });

  it('never accepts an arbitrary 6-digit code in production', async () => {
    const config = makeConfig({
      'app.environment': 'production',
      'auth.otpDevBypass': 'false',
      'msg91.authKey': 'test-key',
      'msg91.templateId': 'test-template',
    });
    const service = new OtpService(config, redisStub);
    const future = new Date(Date.now() + 60_000);
    // bcrypt hash of a different code — '123456' must not match.
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('654321', 10);
    await expect(service.verifyOtp('123456', hash, future)).resolves.toBe(false);
  });

  it('accepts any 6-digit code in development (dev bypass)', async () => {
    const config = makeConfig({
      'app.environment': 'development',
      'auth.otpDevBypass': 'false',
    });
    const service = new OtpService(config, redisStub);
    const future = new Date(Date.now() + 60_000);
    await expect(service.verifyOtp('123456', 'irrelevant', future)).resolves.toBe(true);
  });
});

describe('OtpService — MSG91 delivery failure surfacing', () => {
  const prodConfig = makeConfig({
    'app.environment': 'production',
    'auth.otpDevBypass': 'false',
    'msg91.authKey': 'test-key',
    'msg91.templateId': 'test-template',
  });
  const redisWithSet = { set: jest.fn() } as unknown as RedisService;
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws when MSG91 responds HTTP 200 with a type:error body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve('{"type":"error","message":"Template ID Missing or Invalid Template"}'),
    }) as unknown as typeof fetch;
    const service = new OtpService(prodConfig, redisWithSet);
    await expect(service.sendOtp('+919999900001')).rejects.toThrow(/OTP/);
  });

  it('throws when MSG91 responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 418,
      text: () => Promise.resolve('{"type":"error","message":"IP not whitelisted"}'),
    }) as unknown as typeof fetch;
    const service = new OtpService(prodConfig, redisWithSet);
    await expect(service.sendOtp('+919999900001')).rejects.toThrow(/OTP/);
  });

  it('resolves when MSG91 responds with type:success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"type":"success","request_id":"abc"}'),
    }) as unknown as typeof fetch;
    const service = new OtpService(prodConfig, redisWithSet);
    await expect(service.sendOtp('+919999900001')).resolves.toMatchObject({
      hash: expect.any(String),
    });
  });
});

describe('OtpService — OTP generation', () => {
  it('always produces a full-length numeric code (no leading-zero truncation)', () => {
    const config = makeConfig({ 'app.environment': 'development', 'msg91.otpLength': 6 });
    const service = new OtpService(config, {} as RedisService);
    for (let i = 0; i < 500; i++) {
      const otp = (service as unknown as { generateOtp(): string }).generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });
});
