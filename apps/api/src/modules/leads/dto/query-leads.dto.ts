import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLeadsDto {
  @ApiPropertyOptional()
  propertyId?: string;

  @ApiPropertyOptional()
  societyId?: string;

  @ApiPropertyOptional()
  dealerId?: string;

  @ApiPropertyOptional({
    enum: [
      'NEW',
      'CONTACTED',
      'VISIT_SCHEDULED',
      'VISITED',
      'NEGOTIATING',
      'CLOSING',
      'CLOSED',
      'LOST',
    ],
  })
  status?: string;

  @ApiPropertyOptional({ enum: ['APP_SEARCH', 'REFERRAL', 'WHATSAPP', 'WALK_IN'] })
  source?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
