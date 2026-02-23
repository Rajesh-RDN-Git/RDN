import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReferralsDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'SIGNED_UP', 'TRANSACTED', 'REWARDED'] })
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
