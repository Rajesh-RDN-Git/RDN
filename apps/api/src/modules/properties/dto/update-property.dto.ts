import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePropertyDto {
  @ApiPropertyOptional({ example: 'A-101' })
  flatNumber?: string;

  @ApiPropertyOptional({ example: 'Tower A' })
  towerBlock?: string;

  @ApiPropertyOptional({ enum: ['APARTMENT', 'COMMERCIAL', 'VILLA'] })
  type?: string;

  @ApiPropertyOptional({ enum: ['RENT', 'SALE', 'BOTH'] })
  transactionType?: string;

  @ApiPropertyOptional({ example: 3 })
  bhk?: number;

  @ApiPropertyOptional({ example: 1200 })
  carpetArea?: number;

  @ApiPropertyOptional({ example: 1500 })
  superArea?: number;

  @ApiPropertyOptional({ example: 5 })
  floor?: number;

  @ApiPropertyOptional({ enum: ['GROUND', 'TOP'] })
  floorLabel?: string;

  @ApiPropertyOptional({ example: 20 })
  totalFloors?: number;

  @ApiPropertyOptional({ example: 'East' })
  facing?: string;

  @ApiPropertyOptional({ enum: ['FURNISHED', 'SEMI', 'UNFURNISHED'] })
  furnishing?: string;

  @ApiPropertyOptional({ example: { AC: 2 } })
  furnishingDetails?: Record<string, number>;

  @ApiPropertyOptional({ type: [String] })
  additionalRooms?: string[];

  @ApiPropertyOptional({ type: [String] })
  propertyView?: string[];

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ example: 25000 })
  priceRent?: number;

  @ApiPropertyOptional({ example: 7500000 })
  priceSale?: number;

  @ApiPropertyOptional({ example: 50000 })
  securityDeposit?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  availableFrom?: string;

  @ApiPropertyOptional({
    enum: ['AVAILABLE_NOW', 'AVAILABLE_FROM', 'UNDER_NOTICE', 'OCCUPIED', 'SOLD'],
  })
  availabilityStatus?: string;

  @ApiPropertyOptional()
  restrictions?: Record<string, unknown>;

  @ApiPropertyOptional()
  amenities?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'DELISTED', 'CLOSED'] })
  status?: string;
}
