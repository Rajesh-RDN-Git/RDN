import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryGrievancesDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'] })
  status?: string;

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  severity?: string;

  @ApiPropertyOptional({
    enum: ['DEALER_CONDUCT', 'PROPERTY_MISMATCH', 'COMMISSION', 'SERVICE', 'SAFETY', 'OTHER'],
  })
  category?: string;

  @ApiPropertyOptional()
  societyId?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
