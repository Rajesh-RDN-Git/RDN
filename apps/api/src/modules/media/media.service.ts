import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type { PresignedUrlDto } from './dto/presigned-url.dto';
import type { AddMediaDto } from './dto/add-media.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getPresignedUrl(data: PresignedUrlDto) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(data.contentType)) {
      throw new BadRequestException(
        `Unsupported content type: ${data.contentType}. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    const bucket = this.configService.get<string>('aws.s3Bucket') || 'rdn-dev-uploads';
    const cdnUrl = this.configService.get<string>('aws.cloudFrontUrl') || '';
    const ext = data.fileName.split('.').pop() || 'jpg';
    const key = `properties/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // In development, return a mock presigned URL
    // In production, this would use @aws-sdk/s3-request-presigner
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    if (isDev) {
      return {
        uploadUrl: `https://${bucket}.s3.ap-south-1.amazonaws.com/${key}?X-Amz-Algorithm=mock-dev`,
        key,
        cdnUrl: cdnUrl
          ? `${cdnUrl}/${key}`
          : `https://${bucket}.s3.ap-south-1.amazonaws.com/${key}`,
        expiresIn: 300,
      };
    }

    // Production: Generate real presigned URL
    // This requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
    // to be installed. Leaving as a placeholder that returns the same shape.
    return {
      uploadUrl: `https://${bucket}.s3.ap-south-1.amazonaws.com/${key}`,
      key,
      cdnUrl: cdnUrl ? `${cdnUrl}/${key}` : `https://${bucket}.s3.ap-south-1.amazonaws.com/${key}`,
      expiresIn: 300,
    };
  }

  async addMedia(data: AddMediaDto) {
    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    // Check max media count (10 per property)
    const existingCount = await this.prisma.propertyMedia.count({
      where: { propertyId: data.propertyId },
    });
    if (existingCount >= 10) {
      throw new BadRequestException('Maximum 10 media files per property');
    }

    return this.prisma.propertyMedia.create({
      data: {
        propertyId: data.propertyId,
        url: data.url,
        type: data.type as any,
        order: data.order ?? existingCount,
      },
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.propertyMedia.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });
  }

  async remove(id: string) {
    const media = await this.prisma.propertyMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');

    // In production, also delete from S3 here
    return this.prisma.propertyMedia.delete({ where: { id } });
  }
}
