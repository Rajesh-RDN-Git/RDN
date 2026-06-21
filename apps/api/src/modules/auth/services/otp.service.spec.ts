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

  it('never accepts an arbitrary 6-digit code in production', async () => {
    const config = makeConfig({
      'app.environment': 'production',
      'auth.otpDevBypass': 'false',
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
