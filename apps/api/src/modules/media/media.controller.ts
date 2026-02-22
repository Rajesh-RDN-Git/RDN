import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  getPresignedUrl(@Body() body: { fileName: string; contentType: string }) {
    return this.mediaService.getPresignedUrl(body.fileName, body.contentType);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media file' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
