import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSocietyDto {
  @ApiProperty({ example: 'Green Valley Apartments' })
  name!: string;

  @ApiProperty({ example: 'green-valley-apartments' })
  slug!: string;

  @ApiProperty({ example: '123 Main Road, Sector 50' })
  address!: string;

  @ApiProperty({ example: 'Gurugram' })
  city!: string;

  @ApiProperty({ example: 'Haryana' })
  state!: string;

  @ApiProperty({ example: '122018' })
  pincode!: string;

  @ApiPropertyOptional({ example: 28.4595 })
  lat?: number;

  @ApiPropertyOptional({ example: 77.0266 })
  lng?: number;

  @ApiPropertyOptional({ example: 500 })
  totalUnits?: number;

  @ApiPropertyOptional({ example: ['Swimming Pool', 'Gym', 'Club House'] })
  amenities?: string[];
}
