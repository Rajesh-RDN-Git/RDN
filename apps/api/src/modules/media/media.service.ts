import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type { PresignedUrlDto } from './dto/presigned-url.dto';
import type { AddMediaDto } from './dto/add-media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: any = null;
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly region: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('aws.s3Bucket') || 'rdn-dev-uploads';
    this.cdnUrl = this.configService.get<string>('aws.cloudFrontUrl') || '';
    this.region = this.configService.get<string>('aws.region') || 'ap-south-1';
    this.initS3Client();
  }

  private async initS3Client() {
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const endpoint = this.configService.get<string>('aws.s3Endpoint');
      const forcePathStyle = this.configService.get<boolean>('aws.s3ForcePathStyle');
      this.s3Client = new S3Client({
        region: this.region,
        ...(endpoint ? { endpoint, forcePathStyle: forcePathStyle ?? true } : {}),
        credentials: {
          accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
          secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || '',
        },
      });
    } catch {
      this.logger.warn('AWS SDK not available. S3 operations will use mock URLs.');
    }
  }

  async getPresignedUrl(data: PresignedUrlDto) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(data.contentType)) {
      throw new BadRequestException(
        `Unsupported content type: ${data.contentType}. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    const ext = data.fileName.split('.').pop() || 'jpg';
    const key = `properties/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    if (this.s3Client) {
      try {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: data.contentType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });

        return {
          uploadUrl,
          key,
          cdnUrl: this.cdnUrl
            ? `${this.cdnUrl}/${key}`
            : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
          expiresIn: 300,
        };
      } catch (err) {
        this.logger.error(`S3 presigned URL generation failed: ${err}`);
      }
    }

    // Fallback: mock presigned URL for development
    return {
      uploadUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}?X-Amz-Algorithm=mock-dev`,
      key,
      cdnUrl: this.cdnUrl
        ? `${this.cdnUrl}/${key}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      expiresIn: 300,
    };
  }

  async addMedia(data: AddMediaDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

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

    // Delete from S3 if client available
    if (this.s3Client) {
      try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        // Extract key from URL
        const url = new URL(media.url);
        const key = url.pathname.slice(1); // Remove leading /
        await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      } catch (err) {
        this.logger.warn(`Failed to delete S3 object: ${err}`);
      }
    }

    return this.prisma.propertyMedia.delete({ where: { id } });
  }
}
