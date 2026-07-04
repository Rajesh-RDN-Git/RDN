import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { EncryptionService } from '../../common/crypto/encryption.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let otpService: jest.Mocked<OtpService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockPrisma = {
    user: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEncryption = {
    blindIndex: jest.fn((v: string) => `hash(${v})`),
    encrypt: jest.fn((v: string) => `v1:${v}`),
    decrypt: jest.fn((v: string) => v),
    isEncrypted: jest.fn((v: string) => v.startsWith('v1:')),
  };

  const mockOtpService = {
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockTokenService = {
    generateTokenPair: jest.fn(),
    refreshTokenPair: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OtpService, useValue: mockOtpService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: EncryptionService, useValue: mockEncryption },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    otpService = module.get(OtpService);
    tokenService = module.get(TokenService);
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should send OTP and upsert user', async () => {
      mockOtpService.sendOtp.mockResolvedValue({
        hash: 'hash123',
        expiresAt: new Date('2025-01-01'),
      });
      mockPrisma.user.upsert.mockResolvedValue({});

      const result = await service.sendOtp('+919999900001');

      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith('+919999900001');
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phoneHash: 'hash(+919999900001)' },
          update: expect.objectContaining({ otpHash: 'hash123' }),
          create: expect.objectContaining({ phone: '+919999900001', role: 'BUYER_TENANT' }),
        }),
      );
    });
  });

  describe('verifyOtp', () => {
    const mockUser = {
      id: 'user-1',
      phone: '+919999900001',
      name: 'Test User',
      role: 'SUPER_ADMIN',
      email: 'test@test.com',
      otpHash: 'hash123',
      otpExpiresAt: new Date('2099-01-01'),
    };

    it('should verify OTP and return tokens with user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockTokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.verifyOtp('+919999900001', '123456');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user.role).toBe('SUPER_ADMIN');
    });

    it('should throw if no user found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp('+919999900001', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if OTP is invalid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(false);

      await expect(service.verifyOtp('+919999900001', '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should delegate to tokenService', async () => {
      mockTokenService.refreshTokenPair.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await service.refreshToken('old-refresh');

      expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      mockTokenService.revokeRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout('user-1');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockTokenService.revokeRefreshToken).toHaveBeenCalledWith('user-1');
    });
  });
});
