import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPropertiesDto {
  @ApiPropertyOptional({ description: 'Free-text search: society name, city, flat, or tower' })
  q?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  societyId?: string;

  @ApiPropertyOptional({ enum: ['APARTMENT', 'COMMERCIAL', 'VILLA'] })
  type?: string;

  @ApiPropertyOptional({ enum: ['RENT', 'SALE', 'BOTH'] })
  transactionType?: string;

  @ApiPropertyOptional()
  bhk?: number;

  @ApiPropertyOptional()
  priceMin?: number;

  @ApiPropertyOptional()
  priceMax?: number;

  @ApiPropertyOptional({ enum: ['FURNISHED', 'SEMI', 'UNFURNISHED'] })
  furnishing?: string;

  @ApiPropertyOptional({ enum: ['AVAILABLE_NOW', 'AVAILABLE_FROM', 'UNDER_NOTICE'] })
  availabilityStatus?: string;

  @ApiPropertyOptional({ description: 'Min carpet area in sq ft' })
  areaMin?: number;

  @ApiPropertyOptional({ description: 'Max carpet area in sq ft' })
  areaMax?: number;

  @ApiPropertyOptional({ description: 'Comma-separated amenity labels to filter by' })
  amenities?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;

  @ApiPropertyOptional({ enum: ['price_rent', 'price_sale', 'created_at'], default: 'created_at' })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: string;
}
