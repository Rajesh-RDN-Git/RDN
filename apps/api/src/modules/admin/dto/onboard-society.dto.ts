import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardSocietyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  pincode!: string;

  @ApiPropertyOptional()
  totalUnits?: number;

  @ApiPropertyOptional({ type: [String] })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'User ID for the RWA admin' })
  rwaAdminId?: string;

  @ApiPropertyOptional()
  mandateStartDate?: string;

  @ApiPropertyOptional()
  mandateEndDate?: string;
}
