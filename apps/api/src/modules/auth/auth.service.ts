import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { formatPhone } from '@rdn/shared';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { PrismaService } from '../../database/prisma.service';
import { OtpService } from './services/otp.service';
import { TokenService, TokenPair } from './services/token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly encryption: EncryptionService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string }> {
    const { hash, expiresAt } = await this.otpService.sendOtp(phone);

    // Upsert keyed on the phone blind index (phone itself is encrypted, not unique).
    // create.phone / create.phoneHash are encrypted+hashed by the Prisma middleware.
    await this.prisma.user.upsert({
      where: { phoneHash: this.encryption.blindIndex(phone) },
      update: { otpHash: hash, otpExpiresAt: expiresAt },
      create: {
        phone,
        name: 'New User',
        role: 'BUYER_TENANT',
        otpHash: hash,
        otpExpiresAt: expiresAt,
      },
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<TokenPair & { user: Record<string, unknown> }> {
    const user = await this.prisma.user.findFirst({
      where: { phone }, // middleware remaps to phoneHash blind index
    });

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new UnauthorizedException('No OTP request found for this phone number');
    }

    const isValid = await this.otpService.verifyOtp(otp, user.otpHash, user.otpExpiresAt);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP fields
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiresAt: null },
    });

    // Generate token pair
    const tokens = await this.tokenService.generateTokenPair(user.id, user.phone, user.role);

    this.logger.log(`User authenticated: ${user.id} (${user.role})`);

    return {
      ...tokens,
      user: {
        id: user.id,
        // never return the raw phone to any client — mask to last 4 digits
        phone: formatPhone(user.phone),
        name: user.name,
        role: user.role,
        email: user.email,
        primarySocietyId: user.primarySocietyId,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return this.tokenService.refreshTokenPair(refreshToken);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.tokenService.revokeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }
}
