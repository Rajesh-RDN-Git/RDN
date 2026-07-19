import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/redis/redis.service';
import * as bcrypt from 'bcrypt';

const OTP_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly isDev: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const environment = configService.get<string>('app.environment');
    const explicitBypass = configService.get<string>('auth.otpDevBypass') === 'true';
    const isProd = environment === 'production';
    // Hard safety: the OTP bypass (accept any 6-digit code) must never be
    // reachable in production. Fail fast on boot if someone set it there.
    if (isProd && explicitBypass) {
      throw new Error('OTP_DEV_BYPASS must not be enabled in production — refusing to start.');
    }
    this.isDev = !isProd && (environment === 'development' || explicitBypass);

    // In production OTP delivery MUST work — without MSG91 creds sendViaMSG91 is a
    // silent no-op and every user would be locked out. Fail fast on boot instead.
    if (isProd) {
      const authKey = configService.get<string>('msg91.authKey');
      const templateId = configService.get<string>('msg91.templateId');
      if (!authKey || !templateId) {
        throw new Error(
          'MSG91_AUTH_KEY and MSG91_TEMPLATE_ID must be set in production — refusing to start (OTP delivery would silently fail).',
        );
      }
    }
  }

  async sendOtp(phone: string): Promise<{ hash: string; expiresAt: Date }> {
    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(
      Date.now() + (this.configService.get<number>('msg91.otpExpiry') || 5) * 60 * 1000,
    );

    // Store OTP hash in Redis with TTL
    await this.redisService.set(
      `${OTP_PREFIX}${phone}`,
      JSON.stringify({ hash, expiresAt: expiresAt.toISOString() }),
      OTP_TTL_SECONDS,
    );

    if (this.isDev) {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
    } else {
      await this.sendViaMSG91(phone, otp);
    }

    return { hash, expiresAt };
  }

  async verifyOtp(otp: string, hash: string, expiresAt: Date): Promise<boolean> {
    if (new Date() > expiresAt) {
      return false;
    }

    // Dev mode: accept any 6-digit OTP
    if (this.isDev) {
      return /^\d{6}$/.test(otp);
    }

    return bcrypt.compare(otp, hash);
  }

  async verifyOtpFromRedis(phone: string, otp: string): Promise<boolean> {
    const stored = await this.redisService.get(`${OTP_PREFIX}${phone}`);
    if (!stored) return false;

    try {
      const { hash, expiresAt } = JSON.parse(stored);
      const valid = await this.verifyOtp(otp, hash, new Date(expiresAt));
      if (valid) {
        // Remove OTP after successful verification
        await this.redisService.del(`${OTP_PREFIX}${phone}`);
      }
      return valid;
    } catch {
      return false;
    }
  }

  private generateOtp(): string {
    const length = this.configService.get<number>('msg91.otpLength') || 6;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  }

  private async sendViaMSG91(phone: string, otp: string): Promise<void> {
    const authKey = this.configService.get<string>('msg91.authKey');
    const templateId = this.configService.get<string>('msg91.templateId');

    if (!authKey || !templateId) {
      this.logger.warn('MSG91 credentials not configured, skipping OTP send');
      return;
    }

    try {
      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: templateId,
          mobile: phone.replace('+', ''),
          otp,
        }),
      });

      // MSG91 v5 reports failures both as non-2xx and as HTTP 200 with
      // {"type":"error"} in the body — status alone is not a success signal.
      const body = await response.text();
      let type: string | undefined;
      try {
        type = (JSON.parse(body) as { type?: string }).type;
      } catch {
        /* non-JSON body — treat as failure below */
      }
      if (!response.ok || type !== 'success') {
        this.logger.error(`MSG91 OTP send failed (HTTP ${response.status}): ${body}`);
        throw new ServiceUnavailableException('Failed to send OTP, please retry');
      }
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) {
        this.logger.error(`MSG91 OTP send error: ${error}`);
      }
      throw error;
    }
  }
}
