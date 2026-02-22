import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async sendOtp(phone: string) {
    // TODO: Integrate MSG91
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string) {
    // TODO: Verify OTP, create/find user, generate tokens
    return { accessToken: 'TODO', refreshToken: 'TODO' };
  }

  async refreshToken(refreshToken: string) {
    // TODO: Validate refresh token, generate new access token
    return { accessToken: 'TODO' };
  }
}
