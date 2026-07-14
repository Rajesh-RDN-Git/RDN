import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  role: string;
  societyId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Resolve societyId for RWA_ADMIN or DEALER
    let societyId: string | undefined;
    if (user.role === 'RWA_ADMIN') {
      const society = await this.prisma.society.findFirst({
        where: { rwaAdminId: user.id },
        select: { id: true },
      });
      societyId = society?.id;
    } else if (user.role === 'DEALER') {
      const dealer = await this.prisma.dealer.findFirst({
        where: { userId: user.id, isActive: true },
        select: { societyId: true },
      });
      societyId = dealer?.societyId;
    }

    return { ...user, societyId };
  }
}
