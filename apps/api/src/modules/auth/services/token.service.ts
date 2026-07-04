import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTokenPair(userId: string, role: string): Promise<TokenPair> {
    // No PII in tokens — only the user id and role. Phone is resolved from the DB when needed.
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret')!,
      expiresIn: (this.configService.get<string>('jwt.expiration') ?? '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret')!,
      expiresIn: (this.configService.get<string>('jwt.refreshExpiration') ?? '30d') as any,
    });

    // Store hashed refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokenPair(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, refreshToken: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.refreshToken) {
      throw new UnauthorizedException('User not found or token revoked');
    }

    // Verify refresh token matches stored hash
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      // Token reuse detected — revoke all tokens (theft protection)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new UnauthorizedException('Token reuse detected, all sessions revoked');
    }

    // Issue a fresh access token but DO NOT rotate the refresh token. Rotating on
    // every refresh meant the same account in two tabs raced: tab A's refresh
    // invalidated tab B's stored token, and tab B's next refresh tripped the
    // reuse check and revoked every session. Keeping the refresh token stable
    // lets all tabs share it (it's still 30-day expiry and cleared on logout).
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      {
        secret: this.configService.get<string>('jwt.secret')!,
        expiresIn: (this.configService.get<string>('jwt.expiration') ?? '15m') as any,
      },
    );
    return { accessToken, refreshToken };
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
