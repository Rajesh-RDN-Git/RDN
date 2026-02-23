import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedUrlDto {
  @ApiProperty({ example: 'photo-001.jpg' })
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  contentType!: string;

  @ApiPropertyOptional({ description: 'Property ID to associate media with' })
  propertyId?: string;
}
