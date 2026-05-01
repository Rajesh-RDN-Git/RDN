import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSocietyDto {
  @ApiPropertyOptional({ example: 'Green Valley Apartments' })
  name?: string;

  @ApiPropertyOptional({ example: '123 Main Road, Sector 50' })
  address?: string;

  @ApiPropertyOptional({ example: 'Gurugram' })
  city?: string;

  @ApiPropertyOptional({ example: 'Haryana' })
  state?: string;

  @ApiPropertyOptional({ example: '122018' })
  pincode?: string;

  @ApiPropertyOptional({ example: 28.4595 })
  lat?: number;

  @ApiPropertyOptional({ example: 77.0266 })
  lng?: number;

  @ApiPropertyOptional({ example: 500 })
  totalUnits?: number;

  @ApiPropertyOptional({ example: ['Swimming Pool', 'Gym', 'Club House'] })
  amenities?: string[];

  @ApiPropertyOptional({ enum: ['ONBOARDED', 'IN_PROGRESS', 'INACTIVE'] })
  status?: string;

  @ApiPropertyOptional({
    description:
      'SUPER_ADMIN-only: UUID of the user to assign as RWA admin. Pass null to disconnect.',
    nullable: true,
  })
  rwaAdminId?: string | null;
}
