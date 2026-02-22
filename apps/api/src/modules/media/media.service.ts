import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async getPresignedUrl(fileName: string, contentType: string) {
    // TODO: Generate S3 presigned URL for direct upload
    return {
      uploadUrl: 'TODO',
      key: `uploads/${Date.now()}-${fileName}`,
      expiresIn: 300,
    };
  }

  async remove(id: string) {
    // TODO: Delete media record and S3 object
    return { id, deleted: true };
  }
}
