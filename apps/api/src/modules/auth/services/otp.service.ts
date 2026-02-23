import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = configService.get('app.environment') === 'development';
  }

  async sendOtp(phone: string): Promise<{ hash: string; expiresAt: Date }> {
    const otp = this.generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(
      Date.now() + (this.configService.get<number>('msg91.otpExpiry') || 5) * 60 * 1000,
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

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`MSG91 OTP send failed: ${body}`);
      }
    } catch (error) {
      this.logger.error(`MSG91 OTP send error: ${error}`);
      throw error;
    }
  }
}
