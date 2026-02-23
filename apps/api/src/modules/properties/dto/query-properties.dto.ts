import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPropertiesDto {
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

  @ApiPropertyOptional({ enum: ['ACTIVE', 'DELISTED', 'CLOSED'], default: 'ACTIVE' })
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;

  @ApiPropertyOptional({ enum: ['price_rent', 'price_sale', 'created_at'], default: 'created_at' })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: string;
}
