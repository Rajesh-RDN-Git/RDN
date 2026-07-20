import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaService, shouldUseMockS3 } from './media.service';
import { PrismaService } from '../../database/prisma.service';

describe('shouldUseMockS3', () => {
  it('mocks only in local/dev with no endpoint and no static keys', () => {
    expect(shouldUseMockS3({ hasEndpoint: false, hasStaticKeys: false, isProd: false })).toBe(true);
  });
  it('uses a real client in prod even without static keys (resolves the ECS task role)', () => {
    expect(shouldUseMockS3({ hasEndpoint: false, hasStaticKeys: false, isProd: true })).toBe(false);
  });
  it('uses a real client whenever static keys are present', () => {
    expect(shouldUseMockS3({ hasEndpoint: false, hasStaticKeys: true, isProd: false })).toBe(false);
  });
  it('uses a real client with a custom S3 endpoint (R2/dev)', () => {
    expect(shouldUseMockS3({ hasEndpoint: true, hasStaticKeys: false, isProd: false })).toBe(false);
  });
});

describe('MediaService', () => {
  let service: MediaService;

  const mockPrisma = {
    property: { findUnique: jest.fn() },
    propertyMedia: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'aws.s3Bucket': 'test-bucket',
        'aws.cloudFrontUrl': '',
        'aws.region': 'ap-south-1',
        'aws.accessKeyId': '',
        'aws.secretAccessKey': '',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    jest.clearAllMocks();
  });

  describe('getPresignedUrl', () => {
    it('should return mock presigned URL in dev', async () => {
      const result = await service.getPresignedUrl({
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
      });

      expect(result.uploadUrl).toContain('test-bucket');
      expect(result.key).toMatch(/^properties\//);
      expect(result.expiresIn).toBe(300);
    });

    it('should throw for unsupported content type', async () => {
      await expect(
        service.getPresignedUrl({ fileName: 'file.pdf', contentType: 'application/pdf' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addMedia', () => {
    it('should add media to property', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1' });
      mockPrisma.propertyMedia.count.mockResolvedValue(3);
      mockPrisma.propertyMedia.create.mockResolvedValue({ id: 'media-1' });

      const result = await service.addMedia({
        propertyId: 'prop-1',
        url: 'https://bucket.s3.amazonaws.com/photo.jpg',
        type: 'IMAGE',
      } as any);
      expect(result).toEqual({ id: 'media-1' });
    });

    it('should throw if property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      await expect(service.addMedia({ propertyId: 'x' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw if max 10 media reached', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1' });
      mockPrisma.propertyMedia.count.mockResolvedValue(10);

      await expect(
        service.addMedia({ propertyId: 'prop-1', url: 'x', type: 'IMAGE' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByProperty', () => {
    it('should return media ordered by order', async () => {
      mockPrisma.propertyMedia.findMany.mockResolvedValue([{ id: 'm-1' }]);
      const result = await service.findByProperty('prop-1');
      expect(result).toEqual([{ id: 'm-1' }]);
    });
  });

  describe('remove', () => {
    it('should delete media', async () => {
      mockPrisma.propertyMedia.findUnique.mockResolvedValue({
        id: 'm-1',
        url: 'https://bucket.s3.amazonaws.com/photo.jpg',
      });
      mockPrisma.propertyMedia.delete.mockResolvedValue({ id: 'm-1' });

      const result = await service.remove('m-1');
      expect(result).toEqual({ id: 'm-1' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.propertyMedia.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
