import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'uuid' })
  propertyId!: string;

  @ApiProperty({ enum: ['APP_SEARCH', 'REFERRAL', 'WHATSAPP', 'WALK_IN'] })
  source!: string;
}
