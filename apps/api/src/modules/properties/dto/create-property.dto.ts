import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'uuid' })
  societyId!: string;

  @ApiProperty({ example: 'A-101' })
  flatNumber!: string;

  @ApiProperty({ example: 'Tower A' })
  towerBlock!: string;

  @ApiProperty({ enum: ['APARTMENT', 'COMMERCIAL', 'VILLA'] })
  type!: string;

  @ApiProperty({ enum: ['RENT', 'SALE', 'BOTH'] })
  transactionType!: string;

  @ApiPropertyOptional({ example: 3 })
  bhk?: number;

  @ApiPropertyOptional({ example: 1200 })
  carpetArea?: number;

  @ApiPropertyOptional({ example: 1500 })
  superArea?: number;

  @ApiPropertyOptional({ example: 5 })
  floor?: number;

  @ApiPropertyOptional({
    enum: ['GROUND', 'TOP'],
    description: 'Overrides numeric floor for display',
  })
  floorLabel?: string;

  @ApiPropertyOptional({ example: 20 })
  totalFloors?: number;

  @ApiPropertyOptional({ example: 'East' })
  facing?: string;

  @ApiPropertyOptional({ enum: ['FURNISHED', 'SEMI', 'UNFURNISHED'] })
  furnishing?: string;

  @ApiPropertyOptional({
    example: { AC: 2, Geyser: 1 },
    description: 'Furnishing items with counts',
  })
  furnishingDetails?: Record<string, number>;

  @ApiPropertyOptional({ example: ['Puja Room', 'Store Room'], type: [String] })
  additionalRooms?: string[];

  @ApiPropertyOptional({ example: ['Park Facing', 'Pool Facing'], type: [String] })
  propertyView?: string[];

  @ApiPropertyOptional({ example: 'Spacious south-facing flat...' })
  description?: string;

  @ApiPropertyOptional({ example: 25000 })
  priceRent?: number;

  @ApiPropertyOptional({ example: 7500000 })
  priceSale?: number;

  @ApiPropertyOptional({ example: 50000 })
  securityDeposit?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  availableFrom?: string;

  @ApiPropertyOptional()
  restrictions?: Record<string, unknown>;

  @ApiPropertyOptional()
  amenities?: Record<string, unknown>;
}
