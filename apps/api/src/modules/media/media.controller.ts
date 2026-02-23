import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  async getPresignedUrl(@Body() body: PresignedUrlDto): Promise<any> {
    return this.mediaService.getPresignedUrl(body);
  }

  @Post()
  @Roles('OWNER', 'SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Add media record after successful upload' })
  async addMedia(@Body() body: AddMediaDto): Promise<any> {
    return this.mediaService.addMedia(body);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'List media for a property' })
  async findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string): Promise<any> {
    return this.mediaService.findByProperty(propertyId);
  }

  @Delete(':id')
  @Roles('OWNER', 'SUPER_ADMIN', 'RWA_ADMIN')
  @ApiOperation({ summary: 'Delete a media file' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.mediaService.remove(id);
  }
}
