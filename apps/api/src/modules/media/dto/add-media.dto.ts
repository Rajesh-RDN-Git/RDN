import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMediaDto {
  @ApiProperty({ description: 'Property ID to attach media to' })
  propertyId!: string;

  @ApiProperty({ description: 'S3 key or full URL returned after upload' })
  url!: string;

  @ApiProperty({ enum: ['PHOTO', 'VIDEO'] })
  type!: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  order?: number;
}
