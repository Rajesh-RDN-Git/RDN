import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManualLeadDto {
  @ApiProperty({ example: 'Ramesh Kumar' })
  contactName!: string;

  @ApiProperty({ example: '+919876543210' })
  contactPhone!: string;

  @ApiPropertyOptional({ enum: ['MANUAL', 'CALLBACK', 'WHATSAPP', 'WALK_IN', 'REFERRAL'] })
  source?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  propertyId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  societyId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Dealer to assign immediately' })
  dealerId?: string;

  @ApiPropertyOptional({ example: 'Called the helpline asking for 2BHK rentals' })
  note?: string;
}
